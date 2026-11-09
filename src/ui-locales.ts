/** 插件界面词典；用户任务标题、问题和回答内容保持原文。 */
import { zh } from "./locales/zh.ts";
import { en } from "./locales/en.ts";
import { ja } from "./locales/ja.ts";
import { es } from "./locales/es.ts";
import { fr } from "./locales/fr.ts";
import { de } from "./locales/de.ts";
import { ru } from "./locales/ru.ts";
import { pt } from "./locales/pt.ts";

export const dictionaries = {
  zh,
  en,
  ja,
  es,
  fr,
  de,
  ru,
  pt,
} as const;

export type SupportedLanguage = keyof typeof dictionaries;

/**
 * 集中维护 8 门语言中设置分区「宠物」的有效 Label 集合，作为统一事实源。
 */
export const PET_SECTION_LABELS: readonly string[] = Array.from(
  new Set(Object.values(dictionaries).map((d) => d["宠物"])),
);
export const PET_SECTION_LABELS_SET = new Set<string>(PET_SECTION_LABELS);

export function normalizeLanguage(lang: string | undefined | null): SupportedLanguage {
  if (!lang) return "en";
  const l = lang.toLowerCase().trim();
  if (l.startsWith("zh")) return "zh";
  if (l.startsWith("en")) return "en";
  if (l.startsWith("ja")) return "ja";
  if (l.startsWith("es")) return "es";
  if (l.startsWith("fr")) return "fr";
  if (l.startsWith("de")) return "de";
  if (l.startsWith("ru")) return "ru";
  if (l.startsWith("pt")) return "pt";
  return "en";
}

/**
 * 严格保护用户真实任务标题不被意外送进词典。
 * 仅当标题为空或为缺省兜底哨兵「当前任务」时，才走本地化翻译。
 */
export function resolveTaskTitle(
  title: string | undefined | null,
  t: (key: string) => string,
): string {
  const raw = title?.trim();
  if (!raw || raw === "当前任务") {
    return t("当前任务");
  }
  return raw;
}

type PluralMap = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

const pluralRulesCache = new Map<string, Intl.PluralRules>();
function getPluralCategory(lang: string, count: number): Intl.LDMLPluralRule {
  try {
    let rules = pluralRulesCache.get(lang);
    if (!rules) {
      rules = new Intl.PluralRules(lang);
      pluralRulesCache.set(lang, rules);
    }
    return rules.select(count);
  } catch {
    return count === 1 ? "one" : "other";
  }
}

function formatPluralPattern(
  pattern: PluralMap | string,
  lang: string,
  count: number,
): string {
  if (typeof pattern === "string") {
    return pattern.replace("{count}", String(count));
  }
  const category = getPluralCategory(lang, count);
  const template = pattern[category] ?? pattern.other;
  return template.replace("{count}", String(count));
}

const moreConversationsPlurals: Record<SupportedLanguage, PluralMap | string> = {
  zh: "还有 {count} 个会话",
  ja: "他 {count} 件の会話",
  en: {
    one: "1 more conversation",
    other: "{count} more conversations",
  },
  es: {
    one: "1 conversación más",
    other: "{count} conversaciones más",
  },
  fr: {
    one: "{count} autre conversation",
    other: "{count} autres conversations",
  },
  de: {
    one: "Noch 1 weitere Konversation",
    other: "Noch {count} weitere Konversationen",
  },
  ru: {
    one: "Ещё {count} беседа",
    few: "Ещё {count} беседы",
    many: "Ещё {count} бесед",
    other: "Ещё {count} бесед",
  },
  pt: {
    one: "Mais 1 conversa",
    other: "Mais {count} conversas",
  },
};

const restoreDismissedPlurals: Record<SupportedLanguage, PluralMap | string> = {
  zh: "恢复 {count} 条已关闭通知",
  ja: "閉じた通知 {count} 件を復元",
  en: {
    one: "Restore 1 dismissed notification",
    other: "Restore {count} dismissed notifications",
  },
  es: {
    one: "Restaurar 1 notificación descartada",
    other: "Restaurar {count} notificaciones descartadas",
  },
  fr: {
    one: "Restaurer {count} notification fermée",
    other: "Restaurer {count} notifications fermées",
  },
  de: {
    one: "1 verworfene Benachrichtigung wiederherstellen",
    other: "{count} verworfene Benachrichtigungen wiederherstellen",
  },
  ru: {
    one: "Восстановить {count} закрытое уведомление",
    few: "Восстановить {count} закрытых уведомления",
    many: "Восстановить {count} закрытых уведомлений",
    other: "Восстановить {count} закрытых уведомлений",
  },
  pt: {
    one: "Restaurar 1 notificação descartada",
    other: "Restaurar {count} notificações descartadas",
  },
};

const petResourceWarningsPlurals: Record<SupportedLanguage, PluralMap | string> = {
  zh: "有 {count} 项宠物资源需要检查",
  ja: "{count} 件のペットリソースの確認が必要です",
  en: {
    one: "1 pet resource needs attention",
    other: "{count} pet resources need attention",
  },
  es: {
    one: "1 recurso de mascota requiere atención",
    other: "{count} recursos de mascotas requieren atención",
  },
  fr: {
    one: "{count} ressource d'animal nécessite une attention",
    other: "{count} ressources d'animaux nécessitent une attention",
  },
  de: {
    one: "1 Haustier-Ressource erfordert Aufmerksamkeit",
    other: "{count} Haustier-Ressourcen erfordern Aufmerksamkeit",
  },
  ru: {
    one: "Требуется проверить {count} ресурс питомцев",
    few: "Требуется проверить {count} ресурса питомцев",
    many: "Требуется проверить {count} ресурсов питомцев",
    other: "Требуется проверить {count} ресурсов питомцев",
  },
  pt: {
    one: "1 recurso de mascote precisa de atenção",
    other: "{count} recursos de mascotes precisam de atenção",
  },
};

export function formatMoreConversations(language: string, count: number): string {
  const norm = normalizeLanguage(language);
  return formatPluralPattern(moreConversationsPlurals[norm], norm, count);
}

export function formatRestoreDismissed(language: string, count: number): string {
  const norm = normalizeLanguage(language);
  return formatPluralPattern(restoreDismissedPlurals[norm], norm, count);
}

export function formatPetResourceWarnings(language: string, count: number): string {
  const norm = normalizeLanguage(language);
  return formatPluralPattern(petResourceWarningsPlurals[norm], norm, count);
}

export function translator(language: string) {
  return (message: string, values: Record<string, string | number> = {}): string => {
    const norm = normalizeLanguage(language);
    if (message === "还有 {count} 个会话" && values.count !== undefined) {
      return formatMoreConversations(norm, Number(values.count));
    }
    if (message === "恢复 {count} 条已关闭通知" && values.count !== undefined) {
      return formatRestoreDismissed(norm, Number(values.count));
    }
    if (message === "有 {count} 项宠物资源需要检查" && values.count !== undefined) {
      return formatPetResourceWarnings(norm, Number(values.count));
    }

    const dict = (dictionaries[norm] ?? dictionaries.en) as Record<string, string>;
    const text = dict?.[message] ?? (dictionaries.en as Record<string, string>)[message] ?? message;
    return text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
  };
}
