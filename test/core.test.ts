import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer, request as httpRequest, type IncomingMessage } from 'node:http';
import { selectActivity, lookCell, normalizeConfig } from '../src/model.ts';
import { PetLibrary, imageVersion, confined } from '../src/library.ts';
import { createHost, trustedWrite } from '../src/index.ts';
test('等待处理持续优先于正在运行和完成状态', () => {
  const sessions = [{ id: 'a', running: true }, { id: 'b', running: true, waiting: true }, { id: 'c', running: false, completed: true }];
  for (let i = 0; i < 100; i++) assert.equal(selectActivity(sessions, 'a').pose, 'waiting');
  sessions[1]!.waiting = false; assert.equal(selectActivity(sessions, 'a').pose, 'review');
});
test('新会话空闲不伪造完成，错误优先于工作，关联正确任务', () => {
  assert.equal(selectActivity([{ id: 'a', running: false }]).pose, 'idle');
  assert.deepEqual(selectActivity([{ id: 'a', running: true }, { id: 'b', running: false, error: '失败' }]), { pose: 'failed', title: '当前任务', text: '任务出错了', sessionId: 'b' });
});
test('v2注视四个正方向与死区', () => {
  assert.deepEqual(lookCell(0, -100), { row: 9, col: 0 }); assert.deepEqual(lookCell(100, 0), { row: 9, col: 4 });
  assert.deepEqual(lookCell(0, 100), { row: 10, col: 0 }); assert.deepEqual(lookCell(-100, 0), { row: 10, col: 4 }); assert.equal(lookCell(0, 0), null);
});
test('拒绝越界、非有限大小和损坏位置', () => {
  for (const value of [{ size: NaN }, { size: 999 }, { visible: 'false' }, { position: { x: -1, y: 0 } }, { selected: '../secret' }]) assert.throws(() => normalizeConfig(value));
});
test('原版全部九只图集通过几何检查', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dcp-'));
  try { const library = new PetLibrary(resolve('assets/codex'), root, root); await library.init(); assert.equal(library.pets.length, 9); assert.equal(library.warnings.length, 0); for (const pet of library.pets) assert.ok([1, 2].includes(imageVersion(await library.asset(pet.id)))); }
  finally { await rm(root, { recursive: true, force: true }); }
});
test('配置并发更新不丢字段，重启恢复最后结果', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dcp-'));
  try { const library = new PetLibrary(resolve('assets/codex'), root, root); await library.init(); await Promise.all([library.update({ selected: 'hoots' }), library.update({ size: 160 }), library.update({ visible: false })]); const another = new PetLibrary(resolve('assets/codex'), root, root); await another.init(); assert.equal(another.config.selected, 'hoots'); assert.equal(another.config.size, 160); assert.equal(another.config.visible, false); }
  finally { await rm(root, { recursive: true, force: true }); }
});
test('自定义宠物符号链接不能越过注册目录', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dcp-'));
  try { await mkdir(join(root, 'allowed')); await mkdir(join(root, 'outside')); await writeFile(join(root, 'outside', 'file'), 'secret'); await symlink(join(root, 'outside'), join(root, 'allowed', 'escape'), process.platform === 'win32' ? 'junction' : 'dir'); await assert.rejects(confined(join(root, 'allowed'), 'escape/file'), /超出/); }
  finally { await rm(root, { recursive: true, force: true }); }
});
test('拒绝跨站写入并允许同源有标记的 JSON', () => {
  const req = (headers: Record<string, string>) => ({ headers }) as IncomingMessage;
  assert.equal(trustedWrite(req({ host: 'localhost:4173', origin: 'https://evil.test', 'content-type': 'application/json', 'x-dsh-pet': '1' })), false);
  assert.equal(trustedWrite(req({ host: 'localhost:4173', origin: 'http://localhost:4173', 'content-type': 'application/json', 'x-dsh-pet': '1' })), true);
  assert.equal(trustedWrite(req({ host: 'localhost:4173', 'content-type': 'application/json' })), false);
});
test('HTTP真实路由：错误方法不写配置；资产越界、跨站与DNS rebinding被拒绝', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dcp-'));
  const host = await createHost({ root: resolve('.'), dataRoot: root, skillRoot: root });
  const server = createServer((req, res) => void host.handler(req, res));
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const port = (server.address() as { port: number }).port, base = `http://127.0.0.1:${port}/dsh-codex-pet`;
  try {
    assert.equal((await fetch(base + '/api/config')).status, 405);
    assert.equal((await fetch(base + '/preview.html')).status, 404);
    assert.equal((await fetch(base + '/desktop.html')).status, 404);
    // fetch 会重写 Host；用底层 HTTP 客户端验证真实的恶意 Host 请求。
    const hostStatus = await new Promise<number | undefined>((done, reject) => { const req = httpRequest(base + '/api/state', { headers: { host: 'evil.test' } }, response => { response.resume(); done(response.statusCode); }); req.on('error', reject); req.end(); });
    assert.equal(hostStatus, 403);
    assert.equal((await fetch(base + '/api/config', { method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-pet': '1', origin: 'https://evil.test' }, body: '{"size":180}' })).status, 403);
    assert.equal((await fetch(base + '/asset/' + encodeURIComponent('../config.json'))).status, 400);
    assert.equal((await fetch(base + '/api/config', { method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-pet': '1' }, body: '{"size":180}' })).status, 200);
    assert.equal(JSON.parse(await readFile(join(root, 'config.json'), 'utf8')).size, 180);
  } finally { host.dispose(); await new Promise<void>(done => server.close(() => done())); await rm(root, { recursive: true, force: true }); }
});
