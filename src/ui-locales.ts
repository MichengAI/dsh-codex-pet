/** 插件界面词典；用户任务标题、问题和回答内容保持原文。 */
import { zh } from "./locales/zh.ts";
import { en } from "./locales/en.ts";
import { ja } from "./locales/ja.ts";
import { es } from "./locales/es.ts";
import { fr } from "./locales/fr.ts";
import { de } from "./locales/de.ts";
import { ru } from "./locales/ru.ts";
import { pt } from "./locales/pt.ts";

export { zh, en, ja, es, fr, de, ru, pt };

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

export function translator(language: string) {
  return (message: string, values: Record<string, string | number> = {}): string => {
    const norm = normalizeLanguage(language);
    if (norm === "zh") {
      return message.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
    }
    const dict = dictionaries[norm] as Record<string, string>;
    const text = dict?.[message] ?? (dictionaries.en as Record<string, string>)[message] ?? message;
    return text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
  };
}
