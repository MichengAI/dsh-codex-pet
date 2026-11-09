import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { dictionaries, normalizeLanguage, translator } from "../src/ui-locales.ts";

const SUPPORTED_LANGS = ["zh", "en", "ja", "es", "fr", "de", "ru", "pt"] as const;

test("8 门官方语言客户端词典 key 集合与参数插值严格对齐", () => {
  const zhKeys = Object.keys(dictionaries.zh).sort();
  assert.ok(zhKeys.length >= 88, `期望至少 88 个词条，实际 ${zhKeys.length}`);

  for (const lang of SUPPORTED_LANGS) {
    const dict = dictionaries[lang];
    assert.ok(dict, `语言 ${lang} 词典应存在`);
    const keys = Object.keys(dict).sort();
    assert.deepEqual(keys, zhKeys, `语言 ${lang} 词典 key 必须与 zh 完全一致`);

    // 检查插值参数是否一致
    for (const key of zhKeys) {
      const zhParams = Array.from(key.matchAll(/\{(\w+)\}/g)).map((m) => m[1]).sort();
      const val = (dict as Record<string, string>)[key];
      assert.ok(typeof val === "string" && val.length > 0, `语言 ${lang} 的词条 [${key}] 不能为空`);
      const valParams = Array.from(val.matchAll(/\{(\w+)\}/g)).map((m) => m[1]).sort();
      assert.deepEqual(
        valParams,
        zhParams,
        `语言 ${lang} 词条 [${key}] 的插值参数必须与原文一致`,
      );
    }
  }
});

test("8 门语言 locale/*.json 清单元数据完整且 README 文件全部存在", async () => {
  const detailFileMap: Record<string, string> = {
    zh: "README.zh-CN.md",
    en: "README.en.md",
    ja: "README.ja.md",
    es: "README.es.md",
    fr: "README.fr.md",
    de: "README.de.md",
    ru: "README.ru.md",
    pt: "README.pt.md",
  };

  for (const lang of SUPPORTED_LANGS) {
    const raw = await readFile(new URL(`../locale/${lang}.json`, import.meta.url), "utf8");
    const json = JSON.parse(raw);
    assert.ok(json.meta, `locale/${lang}.json 必须包含 meta 节点`);
    assert.ok(json.meta.title, `locale/${lang}.json 必须包含 meta.title`);
    assert.ok(json.meta.description, `locale/${lang}.json 必须包含 meta.description`);
    assert.equal(json.meta.detail, detailFileMap[lang], `locale/${lang}.json 的 meta.detail 应为 ${detailFileMap[lang]}`);

    // 验证对应 README 文件在磁盘上真实存在
    const readmeUrl = new URL(`../${json.meta.detail}`, import.meta.url);
    await assert.doesNotReject(access(readmeUrl, constants.R_OK), `文档 ${json.meta.detail} 必须在仓库中存在且可读`);
    const readmeContent = await readFile(readmeUrl, "utf8");
    assert.ok(readmeContent.includes("DSH Codex Pet"), `${json.meta.detail} 必须包含项目名`);
    assert.ok(
      readmeContent.includes("[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md)"),
      `${json.meta.detail} 必须包含 8 门语言顶部导航`,
    );
  }
});

test("package.json 规范元数据声明", async () => {
  const raw = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const pkg = JSON.parse(raw);

  assert.equal(pkg.author?.name, "MichengAI");
  assert.ok(Array.isArray(pkg.keywords) && pkg.keywords.includes("codex-pet"));
  assert.equal(pkg.icon, "./assets/icon.svg");
  assert.equal(pkg.exports["./icon"], "./assets/icon.svg");
  assert.equal(pkg.dsh?.manifestVersion, 1);
  for (const lang of ["ja", "es", "fr", "de", "ru", "pt"]) {
    assert.ok(pkg.files.includes(`README.${lang}.md`), `files 必须包含 README.${lang}.md`);
  }
});

test("normalizeLanguage 安全回退", () => {
  assert.equal(normalizeLanguage("zh-CN"), "zh");
  assert.equal(normalizeLanguage("en-US"), "en");
  assert.equal(normalizeLanguage("ja-JP"), "ja");
  assert.equal(normalizeLanguage("es-ES"), "es");
  assert.equal(normalizeLanguage("fr-FR"), "fr");
  assert.equal(normalizeLanguage("de-DE"), "de");
  assert.equal(normalizeLanguage("ru-RU"), "ru");
  assert.equal(normalizeLanguage("pt-BR"), "pt");
  assert.equal(normalizeLanguage("pt-PT"), "pt");
  assert.equal(normalizeLanguage("ko"), "en");
  assert.equal(normalizeLanguage(undefined), "en");
  assert.equal(normalizeLanguage(""), "en");
});
