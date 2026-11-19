/** 在独立目录固定目标官方宿主，开发依赖继续使用最新版。 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import semver from 'semver';

export function isolatedHostInstallArgs(npmCli, root, publishedAt) {
  return [npmCli, 'install', '--prefix', root, '--registry=https://registry.npmjs.org/', '--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund', `--before=${publishedAt}`, '--min-release-age-exclude=@deepseek-ai/dsh*'];
}

export function versionPublishedBy(versionTime, cutoff) {
  return Date.parse(versionTime) <= Date.parse(cutoff);
}

export async function testHost(repo, pkg, npmCli) {
  const version = process.env.DSH_PET_E2E_VERSION || pkg.devDependencies['@deepseek-ai/dsh'];
  const range = pkg.engines?.dsh || pkg.peerDependencies?.['@deepseek-ai/dsh-host-webserver'];
  if (!semver.satisfies(version, range, { includePrerelease: true })) throw new Error(`不在兼容矩阵内：${version}`);
  if (version === pkg.devDependencies['@deepseek-ai/dsh']) return createRequire(join(repo, 'package.json')).resolve('@deepseek-ai/dsh/package.json');
  const root = join(resolve(process.env.DSH_PET_E2E_ROOT || join(repo, '.preview')), `dsh-host-${version}`);
  await mkdir(root, { recursive: true });
  // 从目标版本自身的依赖图收集包名，不能拿最新版包清单推断旧版。
  // 宿主自 0.2.2-rc.1 起内部自带稳定 HMR 支持，通过 overrides 强制同版锁定即可满足隔离运行要求。
  const overrides = {};
  const peers = {};
  const platformExcluded = new Set();
  let pending = ['@deepseek-ai/dsh'];
  while (pending.length) {
    const batch = pending.splice(0, 12).filter(name => !overrides[name]);
    for (const name of batch) overrides[name] = version;
    await Promise.all(batch.map(async name => {
      const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`读取 ${name}@${version} 失败：${response.status}`);
      const manifest = await response.json();
      if (manifest.os && Array.isArray(manifest.os)) {
        const allowed = manifest.os.some(os => os.startsWith('!') ? os.slice(1) !== process.platform : os === process.platform);
        if (!allowed) platformExcluded.add(name);
      }
      for (const [peerName, range] of Object.entries(manifest.peerDependencies || {})) {
        if (!peerName.startsWith('@deepseek-ai/dsh') && !manifest.peerDependenciesMeta?.[peerName]?.optional) peers[peerName] = range;
      }
      for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies, ...manifest.peerDependencies })) {
        if (dependency.startsWith('@deepseek-ai/dsh') && !overrides[dependency] && !pending.includes(dependency)) pending.push(dependency);
      }
    }));
  }
  const index = await fetch('https://registry.npmjs.org/@deepseek-ai/dsh', { signal: AbortSignal.timeout(30000) });
  if (!index.ok) throw new Error(`读取宿主发布时间失败：${index.status}`);
  const publishedAt = (await index.json()).time?.[version];
  if (!publishedAt) throw new Error(`缺少 ${version} 的发布时间`);
  console.log(`隔离宿主 ${version}：固定 ${Object.keys(overrides).length} 个官方包，依赖不晚于 ${publishedAt}`);
  const dependencies = { ...peers };
  for (const [name, ver] of Object.entries(overrides)) {
    if (!platformExcluded.has(name)) dependencies[name] = ver;
  }
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'dsh-pet-test-host', version: '0.0.0', private: true, dependencies, overrides }, null, 2));
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/(_KEY|_TOKEN|_SECRET|PASSWORD|CREDENTIAL)/i.test(key)) delete env[key];
  const child = spawn(process.execPath, isolatedHostInstallArgs(npmCli, root, publishedAt), { env, windowsHide: true, stdio: 'inherit' });
  const code = await new Promise((done, reject) => { child.once('error', reject); child.once('close', done); });
  if (code !== 0) throw new Error(`隔离宿主 ${version} 安装失败：${code}`);
  const installed = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
  for (const [path, entry] of Object.entries(installed.packages)) {
    if (/node_modules\/@deepseek-ai\/dsh[^/]*$/.test(path) && entry.version !== version) throw new Error(`宿主混装：${path}@${entry.version}`);
  }
  return createRequire(join(root, 'package.json')).resolve('@deepseek-ai/dsh/package.json');
}
