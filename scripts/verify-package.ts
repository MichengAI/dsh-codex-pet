/** 阻止发布缺少内置宠物或创建 Skill 的空壳包。 */
import { resolve } from 'node:path';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PetLibrary } from '../src/library.ts';
const directory = await mkdtemp(join(tmpdir(), 'dsh-pet-package-'));
try {
  const library = new PetLibrary(resolve('assets/codex'), directory);
  await library.init();
  if (library.pets.length !== 9 || library.warnings.length || !library.snapshot().skillAvailable) throw new Error('发行包必须包含全部九只原版宠物与随包创建 Skill');
  
  // 校验 8 门官方语言的 locale 清单与对应 README 文档完整性与映射契约
  const langs = ['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt'];
  const readmeMap: Record<string, string> = { zh: 'README.zh-CN.md', en: 'README.en.md', ja: 'README.ja.md', es: 'README.es.md', fr: 'README.fr.md', de: 'README.de.md', ru: 'README.ru.md', pt: 'README.pt.md' };
  const { readFile } = await import('node:fs/promises');
  for (const lang of langs) {
    const rawLocale = await readFile(resolve(`locale/${lang}.json`), 'utf8');
    const json = JSON.parse(rawLocale);
    if (!json.meta || json.meta.detail !== readmeMap[lang]) {
      throw new Error(`locale/${lang}.json meta.detail 必须指向 ${readmeMap[lang]}`);
    }
    const rawReadme = await readFile(resolve(readmeMap[lang]), 'utf8');
    if (!rawReadme.includes('[简体中文](README.zh-CN.md) · [English](README.en.md)')) {
      throw new Error(`${readmeMap[lang]} 缺少 8 语导航条`);
    }
  }
  console.log('资源检查通过：9 只内置宠物、独立 DSH 目录、随包 Skill、8 语 locale 与 README');
} finally { await rm(directory, { recursive: true, force: true }); }
