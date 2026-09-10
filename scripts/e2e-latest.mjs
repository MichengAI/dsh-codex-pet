/** 通过官方 CLI 安装发行包并启动隔离 Web Profile，验证真实浏览器链路。 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';
import { startModelFixture } from './e2e-model-fixture.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const dshManifestPath = require.resolve('@deepseek-ai/dsh/package.json');
const dsh = JSON.parse(await readFile(dshManifestPath, 'utf8'));
const pkg = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8'));
assert.equal(dsh.version, pkg.devDependencies['@deepseek-ai/dsh']);
const locale = process.env.DSH_PET_E2E_LOCALE || 'zh-CN';
assert.ok(['zh-CN', 'en-US'].includes(locale), '测试语言仅支持 zh-CN 或 en-US');
const cli = join(dirname(dshManifestPath), dsh.bin.dsh);
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('请通过 npm run test:e2e 执行。');
await mkdir(join(repo, '.preview'), { recursive: true });
const output = await mkdtemp(join(repo, '.preview', 'e2e-latest-'));
const env = { ...process.env, DSH_HOME: join(output, 'home') };
// 隔离环境不继承模型凭据，避免测试误用用户的付费服务。
for (const key of Object.keys(env)) if (/(_KEY|_TOKEN|_SECRET|PASSWORD|CREDENTIAL)/i.test(key)) delete env[key];
const redact = text => text.replace(/([?&](?:token|key|secret|auth)=)[^\s&]+/gi, '$1[redacted]');
async function run(entry, args, label) {
  let log = '';
  const child = spawn(process.execPath, [entry, ...args], { cwd: repo, env, windowsHide: true });
  child.stdout.on('data', data => { log += data; });
  child.stderr.on('data', data => { log += data; });
  const code = await new Promise((done, reject) => { child.once('error', reject); child.once('close', done); });
  await writeFile(join(output, `${label}.log`), redact(log));
  if (code !== 0) throw new Error(`${label} 失败 (${code})：${redact(log.slice(-4000))}`);
  return log;
}
let host, browser, page, model, hostLog = '';
async function stopHost() {
  if (!host || host.exitCode !== null || host.signalCode !== null) return;
  const closed = new Promise(done => host.once('close', done));
  let killLog = '';
  if (process.platform === 'win32') {
    const kill = spawn('taskkill', ['/PID', String(host.pid), '/T', '/F'], { windowsHide: true });
    kill.stdout.on('data', data => { killLog += data; });
    kill.stderr.on('data', data => { killLog += data; });
    await new Promise((done, reject) => { kill.once('error', reject); kill.once('close', done); });
  } else host.kill('SIGTERM');
  // taskkill 的退出事件可能早于 Node 收到目标进程的 close，按目标状态判断。
  let timer;
  try {
    await Promise.race([closed, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`隔离 DSH 未在期限内退出：${killLog}`)), 10000);
    })]);
  } finally { clearTimeout(timer); }
}
async function startHostOnce(patch) {
  const offset = hostLog.length;
  host = spawn(process.execPath, [cli, 'web', '--patch', patch, '--port', '0', '--no-open'], { cwd: output, env, windowsHide: true });
  host.stdout.on('data', data => { hostLog += data; });
  host.stderr.on('data', data => { hostLog += data; });
  let startupError;
  host.once('error', error => { startupError = error; });
  for (let i = 0; i < 600; i++) {
    if (startupError) throw startupError;
    if (host.exitCode !== null) throw new Error(`DSH 启动退出：${redact(hostLog.slice(-5000))}`);
    const url = hostLog.slice(offset).match(/dsh web: (http:\/\/[^\s]+)/)?.[1];
    if (url) return url;
    await new Promise(done => setTimeout(done, 100));
  }
  throw new Error(`DSH 启动超时：${redact(hostLog.slice(-5000))}`);
}
// 只重试 Windows Profile 链接竞争；其他启动错误保留原始失败。
async function startHost(patch) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const offset = hostLog.length;
    try { return await startHostOnce(patch); }
    catch (error) {
      await stopHost();
      const log = hostLog.slice(offset);
      if (process.platform !== 'win32' || attempt === 3 || !/EBUSY/.test(log) || !/symlink|junction|healProfilesModuleFallbackLocked/.test(log)) throw error;
      observations.push(`Windows Profile 链接暂忙，启动重试 ${attempt}/2`);
      await new Promise(done => setTimeout(done, attempt * 1000));
    }
  }
}
async function dismissOnboarding() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    for (const name of [/^(继续|Continue)$/i, /^(稍后配置|稍后设置|Set up later|Configure later)$/i]) {
      const button = page.getByRole('button', { name });
      if (await button.isVisible()) await button.click({ timeout: 5000 });
    }
    try {
      // trial 检查遮挡和可操作性，不触发宠物动作。
      await page.locator('.dcp-pet-button').click({ trial: true, timeout: 1000 });
      return;
    } catch (error) {
      if (error.name !== 'TimeoutError') throw error;
    }
  }
  throw new Error('引导结束后宠物仍不可操作');
}
const checks = [];
const observations = [];
let outcome;
try {
  await run(npmCli, ['pack', '--pack-destination', output], 'pack');
  const tarball = join(output, `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`);
  await run(cli, ['plugin', '--profile', 'web', 'add', tarball, '--registry=https://registry.npmjs.org/', '--ignore-scripts'], 'install');
  checks.push('官方 CLI 从 tgz 安装插件');
  model = await startModelFixture();
  env.DSH_PET_E2E_KEY = randomUUID();
  const patch = join(output, 'model.patch.json');
  await mkdir(join(output, 'diagnostics'));
  await writeFile(join(output, 'diagnostics', 'package.json'), JSON.stringify({ name: 'dsh-pet-e2e-diagnostics', version: '0.0.0', type: 'module', private: true }));
  const diagnostics = join(output, 'diagnostics', 'index.mjs');
  await writeFile(diagnostics, `function detail(error) { return { message: String(error), cause: error?.cause ? detail(error.cause) : undefined }; } export function apply(ctx) { ctx.on('agent/error', ({ agent, error }) => console.log('[pet-e2e-agent-error]', JSON.stringify({ id: agent.id, error: detail(error) }))); }`);
  await writeFile(patch, JSON.stringify([
    { id: 'llm-deepseek', config: { baseURL: model.url, apiKeyEnv: 'DSH_PET_E2E_KEY', thinking: 'disabled', models: [{ id: 'deepseek-chat', name: '本地回归测试模型' }] } },
    { id: 'session-title-llm', disabled: true },
    { insert: [{ id: 'pet-e2e-diagnostics', name: diagnostics }] },
  ]));
  const url = await startHost(patch);
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ locale, viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('.dcp-pet-button').waitFor({ timeout: 45000 });
  await dismissOnboarding();
  await page.waitForFunction(expected => document.documentElement.lang.startsWith(expected), locale.split('-')[0]);
  const state = await page.evaluate(async () => (await fetch('/dsh-codex-pet/api/state')).json());
  assert.equal(state.pets.length, 9);
  assert.equal(state.warnings.length, 0);
  assert.equal(state.skillAvailable, true);
  checks.push('完整 DSH Web 加载插件、九只宠物及随包 Skill');
  await page.screenshot({ path: join(output, 'web-pet.png') });
  await page.locator('.dcp-pet-button').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /设置|Settings/i }).click();
  await page.locator('.dcp-row').first().waitFor();
  assert.equal(await page.locator('.dcp-row').count(), 9);
  await page.locator('.dcp-row').nth(1).getByRole('button').click();
  await page.waitForFunction(async () => (await (await fetch('/dsh-codex-pet/api/state')).json()).config.selected === 'dewey');
  checks.push('真实设置界面选择宠物并写入 Host');
  await page.screenshot({ path: join(output, 'settings.png') });
  await page.reload();
  await page.locator('.dcp-pet-button').waitFor();
  assert.equal(await page.evaluate(async () => (await (await fetch('/dsh-codex-pet/api/state')).json()).config.selected), 'dewey');
  checks.push('页面重载后配置保持');
  const openPetSettings = async () => {
    await page.locator('.dcp-pet-button').click({ button: 'right' });
    await page.getByRole('menuitem', { name: /设置|Settings/i }).click();
    await page.locator('.dcp-row').first().waitFor();
  };
  await openPetSettings();
  await page.getByRole('button', { name: /^创建$|^Create$/ }).click();
  await page.getByRole('textbox', { name: /宠物描述|Pet description/ }).fill('端到端回归测试小海獭');
  await page.getByRole('button', { name: /在 DSH 中创建|Create in DSH/ }).click();
  const wait = async (predicate, label) => {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      if (host.exitCode !== null) throw new Error(`等待 ${label} 时宿主退出：${redact(hostLog.slice(-2000))}`);
      if (predicate()) return;
      await new Promise(done => setTimeout(done, 100));
    }
    throw new Error(`等待 ${label} 超时；请求数=${model.requests.length}；关闭状态=${model.requests.map(request => request.closed)}；宿主日志=${redact(hostLog.slice(-2000))}`);
  };
  await wait(() => model.requests.length >= 1, '模型请求 1');
  assert.equal(model.requests.length, 1, '不得出现额外模型请求');
  assert.ok(JSON.stringify(model.requests[0].body.messages).includes('hatch-pet'));
  assert.ok(JSON.stringify(model.requests[0].body.messages).includes('端到端回归测试小海獭'));
  await page.getByRole('button', { name: /关闭设置|Close settings/ }).click();
  await page.locator('.dcp-bubble-link').filter({ hasText: /正在工作|Working/ }).waitFor();
  checks.push('创建入口经真实 DSH 会话与模型 HTTP 请求发送 Skill 指令，显示运行通知');
  model.respond('question');
  await page.locator('.dcp-bubble-link').filter({ hasText: /等待你处理|Waiting/ }).waitFor();
  await page.getByRole('button', { name: /^(处理请求：|Respond to request:)/ }).click();
  await page.locator('.dcp-tray').getByText('蓝色', { exact: true }).click();
  await page.locator('.dcp-tray').getByRole('button', { name: /提交|Submit/ }).click();
  await wait(() => model.requests.length >= 2, '模型请求 2');
  assert.equal(model.requests.length, 2, '不得出现额外模型请求');
  assert.ok(JSON.stringify(model.requests[1].body.messages).includes('蓝色'));
  model.respond('complete');
  await page.locator('.dcp-bubble-link').filter({ hasText: /已完成|完成|Completed|Finished/ }).waitFor();
  checks.push('真实提问工具经宠物通知提交回答、回传模型并显示完成通知');
  await page.screenshot({ path: join(output, 'session-complete.png') });
  const createTask = async description => {
    await openPetSettings();
    await page.getByRole('button', { name: /^创建$|^Create$/ }).click();
    await page.getByRole('textbox', { name: /宠物描述|Pet description/ }).fill(description);
    await page.getByRole('button', { name: /在 DSH 中创建|Create in DSH/ }).click();
    await page.locator('.dcp-dialog[open] textarea').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: /关闭设置|Close settings/ }).click();
  };
  await createTask('端到端测试：错误通知');
  await wait(() => model.requests.length >= 3, '模型请求 3');
  assert.equal(model.requests.length, 3, '不得出现额外模型请求');
  model.respond('error');
  await page.locator('.dcp-bubble-link').filter({ hasText: /出错|失败|error|failed/i }).waitFor();
  checks.push('模型 HTTP 错误经真实会话传播到宠物失败通知');
  await createTask('端到端测试：停止任务');
  await wait(() => model.requests.length >= 4, '模型请求 4');
  assert.equal(model.requests.length, 4, '不得出现额外模型请求');
  model.startStream();
  await page.waitForFunction(() => document.body.innerText.includes('模型正在等待停止'));
  await page.getByRole('button', { name: /展开会话|Expand conversations/ }).click();
  await page.getByRole('button', { name: /^(停止当前轮次：|Stop current turn:)/ }).click();
  await wait(() => model.requests[3].closed, '请求 4 关闭');
  await page.getByRole('button', { name: /^(停止当前轮次：|Stop current turn:)/ }).waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.dcp-bubble-link').filter({ hasText: /出错|error|failed/i }).count(), 1, '正常停止不应新增失败通知');
  checks.push('宠物停止按钮取消真实会话，并中断模型 HTTP 请求');
  await createTask('端到端测试：响应开始前停止任务');
  await wait(() => model.requests.length >= 5, '模型请求 5');
  assert.equal(model.requests.length, 5, '不得出现额外模型请求');
  await page.getByRole('button', { name: /展开会话|Expand conversations/ }).click();
  const beforeCancel = hostLog.length;
  await page.getByRole('button', { name: /^(停止当前轮次：|Stop current turn:)/ }).click();
  await wait(() => model.requests[4].closed, '请求 5 关闭');
  await page.getByRole('button', { name: /^(停止当前轮次：|Stop current turn:)/ }).waitFor({ state: 'hidden' });
  const cancellationErrors = hostLog.slice(beforeCancel).split('\n').filter(line => line.includes('[pet-e2e-agent-error]'));
  assert.ok(cancellationErrors.length <= 1, '取消不得产生多个宿主错误');
  if (cancellationErrors.length) {
    assert.match(cancellationErrors[0], /session event .*turn\/end.* carries non-JSON-serializable data/, '只允许已确认的上游取消缺陷，其他错误必须失败');
    observations.push(`官方 DSH 在模型响应开始前取消时上报 agent/error：${cancellationErrors[0].trim()}`);
  }
  checks.push('响应开始前停止也中断模型请求；额外记录官方错误事件');
  await page.setViewportSize({ width: 441, height: 700 });
  await page.waitForFunction(() => {
    const rect = document.querySelector('.dcp-floating')?.getBoundingClientRect();
    return rect && rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
  });
  await page.screenshot({ path: join(output, 'narrow-viewport.png') });
  checks.push('窄视口宠物位置不越界');
  await stopHost();
  await page.goto(await startHost(patch));
  await dismissOnboarding();
  assert.equal(await page.evaluate(async () => (await (await fetch('/dsh-codex-pet/api/state')).json()).config.selected), 'dewey');
  checks.push('Host 重启后宠物选择保持');
  assert.deepEqual(errors, [], '浏览器不应产生未处理异常');
  outcome = { dsh: dsh.version, locale, checks, errors, observations };
} catch (error) {
  if (page) {
    await page.screenshot({ path: join(output, 'failure.png') }).catch(() => {});
    await writeFile(join(output, 'failure.txt'), await page.locator('body').innerText().catch(() => '页面不可读'));
  }
  await writeFile(join(output, 'result.json'), JSON.stringify({ dsh: dsh.version, checks, observations, error: String(error) }, null, 2));
  console.error(`端到端失败，证据：${output}`);
  throw error;
} finally {
  await browser?.close();
  try { await stopHost(); }
  catch (error) {
    await writeFile(join(output, 'result.json'), JSON.stringify({ dsh: dsh.version, checks, error: `清理失败：${error}` }, null, 2));
    throw error;
  }
  finally {
    await writeFile(join(output, 'host.log'), redact(hostLog));
    await model?.close();
  }
}
await writeFile(join(output, 'result.json'), JSON.stringify(outcome, null, 2));
console.log(`端到端通过：${checks.join('；')}。隔离进程已停止。证据：${output}`);
for (const observation of observations) console.warn(`上游行为记录：${observation}`);
