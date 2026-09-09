// Node 父进程负责隔离与清理；等待 Electron 退出后再删除其缓存，避免 Windows 文件锁。
const { mkdtempSync, mkdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve, dirname } = require('node:path');
const { spawn } = require('node:child_process');

async function main() {
  const modes = process.argv.slice(2);
  if (!modes.length) modes.push('activity', 'desktop');
  if (modes.some(mode => !['activity', 'desktop'].includes(mode))) throw new Error('仅支持 activity 或 desktop 冒烟测试。');
  const electron = process.env.DSH_ELECTRON_PATH || require('electron');
  const base = resolve(tmpdir());
  const root = mkdtempSync(join(base, 'dsh-pet-smoke-'));
  try {
    for (const mode of modes) {
      const runDir = join(root, mode);
      mkdirSync(runDir);
      console.log(`运行 ${mode} 冒烟测试（系统临时目录）`);
      const env = { ...process.env, DSH_PET_SMOKE_DIR: runDir };
      delete env.ELECTRON_RUN_AS_NODE;
      await new Promise((done, reject) => {
        const child = spawn(electron, [join(__dirname, `smoke-${mode}.cjs`)], {
          cwd: resolve(__dirname, '..'), env, stdio: 'inherit', windowsHide: true,
        });
        child.once('error', reject);
        child.once('close', code => code === 0 ? done() : reject(new Error(`${mode} 冒烟测试退出码 ${code}`)));
      });
    }
  } finally {
    if (dirname(root) !== base) throw new Error('临时目录越界，拒绝清理。');
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    console.log('冒烟测试临时目录已清理。');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
