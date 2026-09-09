/** 内置宠物的显示文案；不改写宠物标识、自定义内容或持久化数据。 */
import { BUILTINS, type Pet } from './model.ts';
export interface PetLocaleStore { getSnapshot(): { active: string }; subscribe(listener: () => void): () => void }
type BuiltinId = typeof BUILTINS[number][0];
const zh: Record<BuiltinId, readonly [string, string]> = {
  codex: ['Codex', '最初的 Codex 小伙伴。'],
  dewey: ['露露', '安静陪伴，让你专注每一天。'],
  fireball: ['小火球', '活力满满，陪你快速推进。'],
  hoots: ['咕咕', '目光敏锐的小猫头鹰，陪你打磨每个细节。'],
  rocky: ['小石头', '改动再多，也有稳稳的陪伴。'],
  seedy: ['小芽', '一点新绿，陪新想法慢慢发芽。'],
  stacky: ['叠叠', '稳稳叠好，安心投入深度工作。'],
  bsod: ['蓝屏小精灵', '住在小蓝屏里的调皮精灵。'],
  'null-signal': ['空信号', '来自虚空的一点安静回应。'],
};
export function localizePet(pet: Pet, locale: string): Pet {
  if (pet.source !== 'builtin') return pet;
  const entry = BUILTINS.find(([id]) => id === pet.id);
  if (!entry) return pet;
  const [name, description] = /^zh(?:-|$)/i.test(locale) ? zh[entry[0]] : [entry[1], entry[2]];
  return { ...pet, name, description };
}
