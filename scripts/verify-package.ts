/** 阻止发布缺少内置宠物或创建 Skill 的空壳包。 */
import { resolve } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PetLibrary } from '../src/library.ts';
const directory = await mkdtemp(join(tmpdir(), 'dsh-pet-package-'));
try {
  const library = new PetLibrary(resolve('assets/codex'), directory);
  await library.init();
  if (library.pets.length !== 9 || library.warnings.length || !library.snapshot().skillAvailable) throw new Error('发行包必须包含全部九只原版宠物与随包创建 Skill');
  console.log('资源检查通过：9 只内置宠物、独立 DSH 目录、随包 Skill');
} finally { await rm(directory, { recursive: true, force: true }); }
