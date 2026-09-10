import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { retryStartup, finishReport } from '../scripts/e2e-runtime.mjs';
import { verifyCi } from '../scripts/verify-release-ci.mjs';

test('启动预算包含尝试耗时，只重试已识别的错误，保留最终原因', async () => {
  let time = 0, attempts = 0;
  const busy = new Error('EBUSY symlink');
  await assert.rejects(retryStartup({
    now: () => time, sleep: async ms => { time += ms; }, budget: 12000,
    start: async deadline => { assert.equal(deadline, 12000); attempts++; time += Math.min(4000, deadline - time); throw busy; },
    retryable: () => true,
  }), error => error.cause === busy);
  assert.equal(attempts, 2);
  assert.equal(time, 12000);
  attempts = 0;
  await assert.rejects(retryStartup({ start: async () => { attempts++; throw new Error('配置错误'); }, retryable: () => false }), /配置错误/);
  assert.equal(attempts, 1);
});

test('证据回收保留运行中、历史和固定证据，不跟随 junction 删除目标', () => {
  execFileSync(process.platform === 'win32' ? 'powershell.exe' : 'pwsh', ['-NoProfile', '-File', fileURLToPath(new URL('./prune-e2e.test.ps1', import.meta.url))], { windowsHide: true, timeout: 30000, stdio: 'pipe' });
});

test('启动竞争可恢复，清理错误不会覆盖原始失败与语言', async () => {
  let time = 0, attempts = 0;
  assert.equal(await retryStartup({ now: () => time, sleep: async ms => { time += ms; },
    start: async () => { if (++attempts === 1) throw new Error('busy'); return 'url'; }, retryable: () => true,
  }), 'url');
  const report = { locale: 'en-US', error: '原始失败', observations: ['重试'], cleanupErrors: [] };
  let cleaned = false;
  await finishReport(report, [async () => { throw new Error('关闭失败'); }, async () => { cleaned = true; }]);
  assert.equal(cleaned, true);
  assert.equal(report.error, '原始失败');
  assert.equal(report.locale, 'en-US');
  assert.deepEqual(report.observations, ['重试']);
  assert.match(report.cleanupErrors[0], /关闭失败/);
});

test('发布只接受相同 SHA 的 main push 完整双语成功记录', async () => {
  const run = { id: 7, head_sha: 'abc', head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success', run_attempt: 2 };
  const jobs = ['test', 'e2e (zh-CN)', 'e2e (en-US)'].map(name => ({ name, status: 'completed', conclusion: 'success' }));
  const api = async path => path.includes('/jobs') ? [{ jobs }] : [{ workflow_runs: [run] }];
  assert.equal(await verifyCi(api, 'owner/repo', 'abc'), 7);
  await assert.rejects(verifyCi(api, 'owner/repo', 'other'), /没有/);
  run.event = 'pull_request';
  await assert.rejects(verifyCi(api, 'owner/repo', 'abc'), /没有/);
  run.event = 'push'; jobs.pop();
  await assert.rejects(verifyCi(api, 'owner/repo', 'abc'), /en-US/);
  jobs.push({ name: 'e2e (en-US)', status: 'completed', conclusion: 'skipped' });
  await assert.rejects(verifyCi(api, 'owner/repo', 'abc'), /en-US/);
  await assert.rejects(verifyCi(async () => { throw new Error('API 错误'); }, 'owner/repo', 'abc'), /API 错误/);
});
