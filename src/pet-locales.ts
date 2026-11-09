/** 内置宠物的显示文案；不改写宠物标识、自定义内容或持久化数据。 */
import { BUILTINS, type Pet } from "./model.ts";
import { normalizeLanguage } from "./ui-locales.ts";

export interface PetLocaleStore {
  getSnapshot(): { active: string };
  subscribe(listener: () => void): () => void;
}
type BuiltinId = (typeof BUILTINS)[number][0];

const zh: Record<BuiltinId, readonly [string, string]> = {
  codex: ["Codex", "最初的 Codex 小伙伴。"],
  dewey: ["露露", "安静陪伴，让你专注每一天。"],
  fireball: ["小火球", "活力满满，陪你快速推进。"],
  hoots: ["咕咕", "目光敏锐的小猫头鹰，陪你打磨每个细节。"],
  rocky: ["小石头", "改动再多，也有稳稳的陪伴。"],
  seedy: ["小芽", "一点新绿，陪新想法慢慢发芽。"],
  stacky: ["叠叠", "稳稳叠好，安心投入深度工作。"],
  bsod: ["蓝屏小精灵", "住在小蓝屏里的调皮精灵。"],
  "null-signal": ["空信号", "来自虚空的一点安静回应。"],
};

const ja: Record<BuiltinId, readonly [string, string]> = {
  codex: ["Codex", "元祖 Codex の仲間。"],
  dewey: ["露露 (Dewey)", "穏やかな付き添いで、毎日の集中をサポート。"],
  fireball: ["ファイヤーボール", "エネルギー満点で、素早いイテレーションを後押し。"],
  hoots: ["ホーホー (Hoots)", "鋭い眼差しの小さなフクロウ。細部まで磨き上げます。"],
  rocky: ["ロッキー", "どんなに差分が大きくても、頼もしい相棒。"],
  seedy: ["シーディー", "新しいアイデアを芽吹かせる小さな緑。"],
  stacky: ["スタッキー", "しっかりと積み重ね、深い集中ワークへ。"],
  bsod: ["ブルースクリーン小悪魔", "小さなブルースクリーンに住むいたずら好きな妖精。"],
  "null-signal": ["ヌルシグナル", "虚空から届く静かな応答。"],
};

const es: Record<BuiltinId, readonly [string, string]> = {
  codex: ["Codex", "El compañero original de Codex."],
  dewey: ["Dewey", "Un compañero tranquilo para días de máxima concentración."],
  fireball: ["Fireball", "Energía pura para una iteración rápida."],
  hoots: ["Hoots", "Un búho de mirada aguda para pulir cada detalle."],
  rocky: ["Rocky", "Una roca firme cuando las diferencias aumentan."],
  seedy: ["Seedy", "Pequeños brotes verdes para nuevas ideas."],
  stacky: ["Stacky", "Una pila equilibrada para trabajo profundo."],
  bsod: ["BSOD", "Un duendecillo travieso de pantalla azul."],
  "null-signal": ["Null Signal", "Una señal tranquila desde el vacío."],
};

const fr: Record<BuiltinId, readonly [string, string]> = {
  codex: ["Codex", "Le compagnon Codex originel."],
  dewey: ["Dewey", "Un compagnon calme pour des journées de travail concentrées."],
  fireball: ["Fireball", "Une énergie vive pour avancer rapidement."],
  hoots: ["Hoots", "Une petite chouette au regard vif pour peaufiner chaque détail."],
  rocky: ["Rocky", "Un roc inébranlable même face aux plus gros diffs."],
  seedy: ["Seedy", "De petites pousses vertes pour faire germer vos idées."],
  stacky: ["Stacky", "Bien empilé pour plonger dans un travail en profondeur."],
  bsod: ["BSOD", "Un lutin espiègle tout droit sorti d’un écran bleu."],
  "null-signal": ["Null Signal", "Une douce réponse venue du néant."],
};

const de: Record<BuiltinId, readonly [string, string]> = {
  codex: ["Codex", "Der originale Codex-Gefährte."],
  dewey: ["Dewey", "Ein ruhiger Begleiter für konzentrierte Arbeitstage."],
  fireball: ["Fireball", "Voller Energie für schnelle Iterationen."],
  hoots: ["Hoots", "Eine scharfäugige Eule für den perfekten Feinschliff."],
  rocky: ["Rocky", "Felsenfeste Begleitung, selbst bei riesigen Diffs."],
  seedy: ["Seedy", "Frisches Grün, um neue Ideen sprießen zu lassen."],
  stacky: ["Stacky", "Stabil gestapelt für tiefes, fokussiertes Arbeiten."],
  bsod: ["BSOD", "Ein schelmischer kleiner Bluescreen-Gremlin."],
  "null-signal": ["Null Signal", "Ein leises Signal aus der Leere."],
};

const ru: Record<BuiltinId, readonly [string, string]> = {
  codex: ["Codex", "Оригинальный питомец Codex."],
  dewey: ["Дьюи", "Спокойный компаньон для продуктивных рабочих дней."],
  fireball: ["Огонёк", "Энергичный спутник для быстрой разработки."],
  hoots: ["Гугу", "Зоркая сова, которая поможет отточить каждую деталь."],
  rocky: ["Рокки", "Надёжная поддержка при любых масштабных изменениях."],
  seedy: ["Росток", "Зелёный росток для новых смелых идей."],
  stacky: ["Стэки", "Уверенная стопка для глубокой сосредоточенной работы."],
  bsod: ["BSOD", "Озорной гремлин с синего экрана смерти."],
  "null-signal": ["Null Signal", "Тихий отклик из цифровой пустоты."],
};

const pt: Record<BuiltinId, readonly [string, string]> = {
  codex: ["Codex", "O companheiro original do Codex."],
  dewey: ["Dewey", "Um companheiro tranquilo para dias de trabalho focado."],
  fireball: ["Fireball", "Energia viva para acelerar o desenvolvimento."],
  hoots: ["Hoots", "Uma coruja atenta para aperfeiçoar cada detalhe."],
  rocky: ["Rocky", "Uma rocha firme quando as alterações aumentam."],
  seedy: ["Seedy", "Pequenos brotos verdes para florescer novas ideias."],
  stacky: ["Stacky", "Uma pilha estável para focar no trabalho profundo."],
  bsod: ["BSOD", "Um pequeno duende travesso da tela azul."],
  "null-signal": ["Null Signal", "Um sinal tranquilo vindo do vazio."],
};

const petDictionaries = {
  zh,
  ja,
  es,
  fr,
  de,
  ru,
  pt,
} as const;

export function localizePet(pet: Pet, locale: string): Pet {
  if (pet.source !== "builtin") return pet;
  const entry = BUILTINS.find(([id]) => id === pet.id);
  if (!entry) return pet;
  const lang = normalizeLanguage(locale);
  if (lang === "en") {
    return { ...pet, name: entry[1], description: entry[2] };
  }
  const dict = petDictionaries[lang as keyof typeof petDictionaries];
  if (dict && dict[entry[0]]) {
    const [name, description] = dict[entry[0]];
    return { ...pet, name, description };
  }
  return { ...pet, name: entry[1], description: entry[2] };
}
