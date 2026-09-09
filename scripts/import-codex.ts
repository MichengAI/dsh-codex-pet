/** 只提取本机 Codex 的原始图集，不导入任何应用或参考项目代码。 */
import { extractFile, listPackage } from '@electron/asar';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { BUILTINS } from '../src/model.ts';
const archive = process.argv[2];
if (!archive) throw new Error('用法：npm run assets:import -- <Codex app.asar 绝对路径>');
const entries = listPackage(archive, { isPack: false });
const provenance: unknown[] = [];
for (const [id] of BUILTINS) {
  const candidates = entries.filter(name => basename(name).startsWith(`${id}-spritesheet-`) && name.endsWith('.webp'));
  if (candidates.length !== 1) throw new Error(`${id} 图集匹配数为 ${candidates.length}，请核对 Codex 版本`);
  const original = candidates[0]!;
  const bytes = extractFile(archive, original.replace(/^[\\/]/, ''));
  const folder = join('assets', 'codex', id);
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, 'spritesheet.webp'), bytes);
  provenance.push({ id, original, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
}
await writeFile('assets/codex/source.json', JSON.stringify({ source: archive, importedAt: new Date().toISOString(), assets: provenance }, null, 2), 'utf8');
console.log(`已提取 ${provenance.length} 个原始图集，无应用代码。`);
