import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import {
  dictionaries,
  normalizeLanguage,
  translator,
  resolveTaskTitle,
  PET_SECTION_LABELS,
  PET_SECTION_LABELS_SET,
  formatMoreConversations,
  formatRestoreDismissed,
  formatPetResourceWarnings,
} from "../src/ui-locales.ts";

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

test("8 门语言核心文案语义与单复数表达守护", () => {
  // 单复数与俄语变格守护
  assert.equal(translator("en")("还有 {count} 个会话", { count: 1 }), "1 more conversation");
  assert.equal(translator("en")("还有 {count} 个会话", { count: 2 }), "2 more conversations");
  assert.equal(translator("en")("还有 {count} 个会话", { count: 21 }), "21 more conversations");

  assert.equal(translator("ru")("还有 {count} 个会话", { count: 1 }), "Ещё 1 беседа");
  assert.equal(translator("ru")("还有 {count} 个会话", { count: 2 }), "Ещё 2 беседы");
  assert.equal(translator("ru")("还有 {count} 个会话", { count: 5 }), "Ещё 5 бесед");
  assert.equal(translator("ru")("还有 {count} 个会话", { count: 21 }), "Ещё 21 беседа");

  assert.equal(translator("ru")("恢复 {count} 条已关闭通知", { count: 1 }), "Восстановить 1 закрытое уведомление");
  assert.equal(translator("ru")("恢复 {count} 条已关闭通知", { count: 2 }), "Восстановить 2 закрытых уведомления");
  assert.equal(translator("ru")("恢复 {count} 条已关闭通知", { count: 5 }), "Восстановить 5 закрытых уведомлений");

  assert.equal(translator("fr")("还有 {count} 个会话", { count: 1 }), "1 autre conversation");
  assert.equal(translator("fr")("还有 {count} 个会话", { count: 2 }), "2 autres conversations");

  assert.equal(translator("de")("还有 {count} 个会话", { count: 1 }), "Noch 1 weitere Konversation");
  assert.equal(translator("de")("还有 {count} 个会话", { count: 2 }), "Noch 2 weitere Konversationen");

  // 资源告警复数与俄语变格守护 (覆盖 R5)
  assert.equal(translator("en")("有 {count} 项宠物资源需要检查", { count: 1 }), "1 pet resource needs attention");
  assert.equal(translator("en")("有 {count} 项宠物资源需要检查", { count: 2 }), "2 pet resources need attention");
  assert.equal(translator("ru")("有 {count} 项宠物资源需要检查", { count: 1 }), "Требуется проверить 1 ресурс питомцев");
  assert.equal(translator("ru")("有 {count} 项宠物资源需要检查", { count: 2 }), "Требуется проверить 2 ресурса питомцев");
  assert.equal(translator("ru")("有 {count} 项宠物资源需要检查", { count: 5 }), "Требуется проверить 5 ресурсов питомцев");

  // 格式化函数直接可达性与 count=0 动态替换（不写死 1，覆盖 R3）
  assert.equal(formatMoreConversations("fr", 0), "0 autre conversation");
  assert.equal(formatMoreConversations("pt", 0), "Mais 0 conversa");
  assert.equal(formatRestoreDismissed("fr", 0), "Restaurer 0 notification fermée");
  assert.equal(formatPetResourceWarnings("de", 1), "1 Haustier-Ressource erfordert Aufmerksamkeit");
  assert.equal(formatPetResourceWarnings("ru", 3), "Требуется проверить 3 ресурса питомцев");

  // 用户任务标题保护（避免误进词典）
  assert.equal(resolveTaskTitle("当前任务", translator("en")), "Current task");
  assert.equal(resolveTaskTitle("", translator("en")), "Current task");
  assert.equal(resolveTaskTitle(undefined, translator("en")), "Current task");
  assert.equal(resolveTaskTitle("宠物", translator("en")), "宠物");
  assert.equal(resolveTaskTitle("空闲", translator("en")), "空闲");
  assert.equal(resolveTaskTitle("自定义编码会话", translator("en")), "自定义编码会话");

  // 设置行 8 语 label 集合对齐
  assert.equal(PET_SECTION_LABELS.length, 8);
  assert.equal(PET_SECTION_LABELS_SET.size, 8);
  for (const label of ["宠物", "Pets", "ペット", "Mascotas", "Animaux", "Haustiere", "Питомцы", "Mascotes"]) {
    assert.ok(PET_SECTION_LABELS.includes(label), `PET_SECTION_LABELS 应包含 ${label}`);
    assert.ok(PET_SECTION_LABELS_SET.has(label), `PET_SECTION_LABELS_SET 应包含 ${label}`);
  }

  // 核心词条
  assert.equal(translator("zh")("宠物"), "宠物");
  assert.equal(translator("ja")("宠物"), "ペット");
  assert.equal(translator("es")("宠物"), "Mascotas");
  assert.equal(translator("fr")("宠物"), "Animaux");
  assert.equal(translator("de")("宠物"), "Haustiere");
  assert.equal(translator("ru")("宠物"), "Питомцы");
  assert.equal(translator("pt")("宠物"), "Mascotes");
  assert.equal(translator("en")("当前任务"), "Current task");
  assert.equal(translator("ja")("当前任务"), "現在のタスク");
  assert.equal(translator("de")("当前任务"), "Aktuelle Aufgabe");
});
