import { registerPluginUpdater, type HostRequest, type HostResponse } from './plugin-updater.ts';
/** DSH Host 插件与独立预览共用同一路由实现。 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { BASE } from './model.ts';
import { PetLibrary } from './library.ts';
export const name = 'michengai-codex-pet';
export const inject = ['webServer'];
const packageRoot = fileURLToPath(new URL('../', import.meta.url));
export function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(data));
}
export function trustedWrite(req: IncomingMessage): boolean {
  if (req.headers['x-dsh-pet'] !== '1' || !req.headers['content-type']?.startsWith('application/json')) return false;
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  if (req.headers.origin) { try { if (new URL(req.headers.origin).host !== req.headers.host) return false; } catch { return false; } }
  return true;
}
async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) { size += chunk.length; if (size > 16384) throw new Error('请求过大'); chunks.push(Buffer.from(chunk)); }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('请求必须是 JSON 对象');
  return value as Record<string, unknown>;
}
export async function createHost(options: { root?: string; dataRoot?: string; skillRoot?: string; getService?(name: string): unknown } = {}) {
  const root = options.root ?? packageRoot;
  const library = new PetLibrary(join(root, 'assets', 'codex'), options.dataRoot, options.skillRoot);
  await library.init();
  let updateHandler: ((req: HostRequest, res: HostResponse) => Promise<void>) | undefined;
  registerPluginUpdater({ get: options.getService, logger: { warn: message => console.warn('[dsh-codex-pet]', message) }, webServer: { register(route) { updateHandler = route.handler; return () => { updateHandler = undefined; }; } } }, { endpoint: `${BASE}/api/update`, packageName: '@michengai/dsh-codex-pet', manifestUrl: new URL('../package.json', import.meta.url) });
  const snapshot = () => ({ ...library.snapshot(), creationAvailable: false, creation: null });
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Host 校验阻止 DNS rebinding；远程 DSH 应由可信反向代理保留本机 Host。
      const authority = new URL(`http://${req.headers.host ?? ''}`);
      if (!['localhost', '127.0.0.1', '[::1]'].includes(authority.hostname)) { json(res, 403, { error: '不受信任的 Host' }); return; }
      const path = new URL(req.url ?? '/', authority).pathname;
      if (path === `${BASE}/api/update` && updateHandler) { await updateHandler(req, res); return; }
      if (req.method === 'GET' && path === `${BASE}/api/state`) { json(res, 200, snapshot()); return; }
      if (req.method === 'GET' && path.startsWith(`${BASE}/asset/`)) {
        const bytes = await library.asset(decodeURIComponent(path.slice(`${BASE}/asset/`.length)));
        const png = bytes[0] === 137;
        res.writeHead(200, { 'content-type': png ? 'image/png' : 'image/webp', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' }); res.end(bytes); return;
      }
      if (req.method === 'GET' && path === `${BASE}/desktop.html`) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; frame-ancestors 'self'" });
        res.end(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>宠物 · DSH</title></head><body><div id="root"></div><script type="module" src="${BASE}/standalone.js"></script></body></html>`); return;
      }
      if (req.method === 'GET' && path === `${BASE}/standalone.js`) { res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' }); res.end(await readFile(join(root, 'lib', 'standalone.js'))); return; }
      if (!path.startsWith(`${BASE}/api/`)) { json(res, 404, { error: '未找到资源' }); return; }
      if (req.method !== 'POST') { json(res, 405, { error: '方法不支持' }); return; }
      if (!trustedWrite(req)) { json(res, 403, { error: '请求来源校验失败' }); return; }
      const value = await body(req);
      if (path === `${BASE}/api/config`) await library.update(value);
      else if (path === `${BASE}/api/refresh`) await library.refresh();
      else if (path === `${BASE}/api/create`) { throw new Error('请从 DSH 宠物设置发起创建会话'); }
      else if (path === `${BASE}/api/open-folder`) {
        if (req.socket.remoteAddress && !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) throw new Error('只能在运行 DSH 的本机打开文件夹');
        await mkdir(library.customPath, { recursive: true });
        if (process.platform === 'win32') {
          // 后台 Host 的窗口状态可能被 Explorer 继承，明确要求正常显示；目录经环境变量传递，不拼接脚本。
          const powershell = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
          const script = '$ErrorActionPreference = "Stop"; Start-Process -FilePath explorer.exe -ArgumentList (\'"\' + $env:DSH_PET_OPEN_DIRECTORY + \'"\') -WindowStyle Normal';
          await new Promise<void>((resolve, reject) => { execFile(powershell, ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 10000, env: { ...process.env, DSH_PET_OPEN_DIRECTORY: library.customPath } }, error => error ? reject(new Error(`打开文件夹失败：${error.message}`)) : resolve()); });
        } else {
          const command = process.platform === 'darwin' ? 'open' : 'xdg-open';
          await new Promise<void>((resolve, reject) => { const child = spawn(command, [library.customPath], { shell: false, stdio: 'ignore' }); child.once('error', reject); child.once('spawn', () => { child.unref(); resolve(); }); });
        }
      } else { json(res, 404, { error: '未知操作' }); return; }
      json(res, 200, snapshot());
    } catch (error) { if (!res.headersSent) json(res, 400, { error: error instanceof Error ? error.message : '操作失败' }); else res.end(); }
  };
  return { handler, library, dispose: () => {} };
}
interface HostContext { get(name: string): { register(route: { kind: 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void }): () => void }; effect(effect: () => () => void): void }
export function apply(ctx: HostContext): void {
  ctx.effect(() => {
    let disposed = false, remove: (() => void) | undefined, host: Awaited<ReturnType<typeof createHost>> | undefined;
    void createHost({ getService: name => ctx.get(name) }).then(value => { host = value; if (disposed) { host.dispose(); return; } remove = ctx.get('webServer').register({ kind: 'prefix', path: BASE, handler: (req, res) => { void value.handler(req, res); } }); }).catch(error => console.error('[dsh-codex-pet] 初始化失败', error));
    return () => { disposed = true; remove?.(); host?.dispose(); };
  });
}
