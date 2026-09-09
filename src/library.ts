/** 宠物与配置存储：内置资产只读，自定义宠物保存于 DSH 自己的数据目录。 */
import { readFile, readdir, realpath, stat, mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { BASE, BUILTINS, DEFAULT_CONFIG, normalizeConfig, type Config, type Library, type Pet } from './model.ts';
export function imageVersion(bytes: Buffer): 1 | 2 {
  let width = 0, height = 0;
  if (bytes.length >= 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const kind = bytes.toString('ascii', 12, 16);
    if (kind === 'VP8X') { width = 1 + bytes.readUIntLE(24, 3); height = 1 + bytes.readUIntLE(27, 3); }
    else if (kind === 'VP8L' && bytes[20] === 47) { const bits = bytes.readUInt32LE(21); width = (bits & 16383) + 1; height = ((bits >>> 14) & 16383) + 1; }
    else if (kind === 'VP8 ') { width = bytes.readUInt16LE(26) & 16383; height = bytes.readUInt16LE(28) & 16383; }
  } else if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20);
  }
  if (width !== 1536 || ![1872, 2288].includes(height)) throw new Error(`图集尺寸 ${width}×${height} 不符合 Codex 8 列协议`);
  return height === 2288 ? 2 : 1;
}
export async function confined(root: string, file: string): Promise<string> {
  const base = await realpath(root), target = await realpath(resolve(root, file));
  const rel = relative(base, target);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('文件超出宠物目录');
  return target;
}
async function smallRead(path: string, limit: number): Promise<Buffer> {
  const info = await stat(path);
  if (!info.isFile() || info.size > limit) throw new Error('文件过大或不是普通文件');
  return readFile(path);
}
export class PetLibrary {
  readonly customPath: string;
  readonly skillPath: string;
  readonly statePath: string;
  config: Config = DEFAULT_CONFIG;
  pets: Pet[] = [];
  warnings: string[] = [];
  private configWarnings: string[] = [];
  private files = new Map<string, { root: string; relative: string }>();
  private queue: Promise<unknown> = Promise.resolve();
  constructor(readonly assetRoot: string, readonly dataRoot = join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'codex-pet'), readonly skillRoot = resolve(assetRoot, '..', '..', 'skills')) {
    this.customPath = join(dataRoot, 'pets'); this.skillPath = join(skillRoot, 'hatch-pet', 'SKILL.md'); this.statePath = join(dataRoot, 'config.json');
  }
  async init(): Promise<void> {
    try { this.config = normalizeConfig(JSON.parse((await readFile(this.statePath, 'utf8')))); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') this.configWarnings.push('配置读取失败，暂用默认值；原文件未改动。'); }
    await mkdir(this.customPath, { recursive: true });
    await this.refresh();
  }
  async refresh(): Promise<void> {
    const pets: Pet[] = []; const files = new Map<string, { root: string; relative: string }>(); const warnings: string[] = [];
    const add = async (id: string, name: string, description: string, root: string, asset: string, source: Pet['source']) => {
      const file = await confined(root, asset);
      const version = imageVersion(await smallRead(file, 32 * 1024 * 1024));
      pets.push({ id, name, description, version, source, url: `${BASE}/asset/${encodeURIComponent(id)}` });
      files.set(id, { root, relative: asset });
    };
    for (const [id, name, description] of BUILTINS) {
      try { await add(id, name, description, this.assetRoot, `${id}/spritesheet.webp`, 'builtin'); }
      catch { warnings.push(`内置宠物 ${name} 的原始图集缺失或不兼容。`); }
    }
    let folders: string[] = [];
    try { folders = await readdir(this.customPath); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') warnings.push('无法读取自定义宠物目录。'); }
    for (const folder of folders.sort()) {
      if (!/^[\w-]+$/.test(folder)) continue;
      try {
        const root = await confined(this.customPath, folder);
        const manifest = JSON.parse((await smallRead(await confined(root, 'pet.json'), 64 * 1024)).toString('utf8')) as Record<string, unknown>;
        if (typeof manifest.spritesheetPath !== 'string') throw new Error('缺少图集路径');
        await add(`custom:${folder}`, String(manifest.displayName ?? folder).slice(0, 100), String(manifest.description ?? '').slice(0, 300), root, manifest.spritesheetPath, 'custom');
      } catch { warnings.push(`自定义宠物 ${folder} 未通过格式校验。`); }
    }
    this.pets = pets; this.files = files; this.warnings = [...this.configWarnings, ...warnings];
  }
  async asset(id: string): Promise<Buffer> {
    const entry = this.files.get(id); if (!entry) throw new Error('宠物不存在');
    return smallRead(await confined(entry.root, entry.relative), 32 * 1024 * 1024);
  }
  async update(value: unknown): Promise<Config> {
    const operation = this.queue.then(async () => {
      const config = normalizeConfig(value, this.config);
      if (!this.pets.some(pet => pet.id === config.selected)) throw new Error('请选择已加载的宠物');
      await mkdir(dirname(this.statePath), { recursive: true });
      const temp = `${this.statePath}.${randomUUID()}.tmp`;
      try { await writeFile(temp, JSON.stringify(config, null, 2), { encoding: 'utf8', flag: 'wx' }); await rename(temp, this.statePath); }
      finally { await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
      this.config = config; return config;
    });
    this.queue = operation.catch(() => undefined); return operation;
  }
  snapshot(): Omit<Library, 'creation' | 'creationAvailable'> { return { pets: this.pets, config: this.config, customPath: this.customPath, warnings: this.warnings, skillAvailable: existsSync(this.skillPath), skillPath: this.skillPath }; }
}
