import type { NotificationState } from './notifications.ts';
import type { TrayCommand } from './notification-tray.tsx';
/** 两种显示端共享的数据与图集协议，不依赖宿主或第三方宠物实现。 */
export const BASE = '/dsh-codex-pet';
export const BUILTINS = [
  ['codex', 'Codex', 'The original Codex companion.'],
  ['dewey', 'Dewey', 'A calm companion for focused workspace days.'],
  ['fireball', 'Fireball', 'Hot path energy for fast iteration.'],
  ['hoots', 'Hoots', 'A sharp-eyed owl for polished work in a blink.'],
  ['rocky', 'Rocky', 'A steady rock when the diff gets large.'],
  ['seedy', 'Seedy', 'Small green shoots for new ideas.'],
  ['stacky', 'Stacky', 'A balanced stack for deep work.'],
  ['bsod', 'BSOD', 'A tiny blue-screen gremlin.'],
  ['null-signal', 'Null Signal', 'Quiet signal from the void.'],
] as const;
export type Pose = 'idle' | 'running-right' | 'running-left' | 'waving' | 'jumping' | 'failed' | 'waiting' | 'running' | 'review';
export const ANIMATIONS: Record<Pose, { row: number; durations: readonly number[] }> = {
  idle: { row: 0, durations: [280, 110, 110, 140, 140, 320] },
  'running-right': { row: 1, durations: [120, 120, 120, 120, 120, 120, 120, 220] },
  'running-left': { row: 2, durations: [120, 120, 120, 120, 120, 120, 120, 220] },
  waving: { row: 3, durations: [140, 140, 140, 280] }, jumping: { row: 4, durations: [140, 140, 140, 140, 280] },
  failed: { row: 5, durations: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, durations: [150, 150, 150, 150, 150, 260] },
  running: { row: 7, durations: [120, 120, 120, 120, 120, 220] }, review: { row: 8, durations: [150, 150, 150, 150, 150, 280] },
};
export interface Pet { id: string; name: string; description: string; url: string; version: 1 | 2; source: 'builtin' | 'custom' }
export interface Config { selected: string; visible: boolean; size: number; position: { x: number; y: number } | null }
export const DEFAULT_CONFIG: Config = { selected: 'codex', visible: true, size: 120, position: null };
export interface Activity { pose: Pose; title: string; text: string; sessionId?: string }
export const IDLE: Activity = { pose: 'idle', title: '', text: '' };
export interface Creation { id: string; status: 'running' | 'completed' | 'failed'; message: string; threadId?: string }
export interface Library { pets: Pet[]; config: Config; customPath: string; warnings: string[]; skillAvailable: boolean; skillPath: string; creationAvailable: boolean; creation: Creation | null }
export interface DesktopState { pet: Pet; config: Config; activity: Activity; notifications?: NotificationState }
export interface DesktopBridge {
  notificationsVersion?: number;
  onCommand?(listener: (command: TrayCommand) => Promise<void>): () => void;
  sync(state: DesktopState | null): Promise<void>;
  onAction(listener: (action: 'hide' | 'open' | 'settings') => void): () => void;
}
declare global { interface Window { dshDesktopPet?: DesktopBridge; petWindow?: {
  onState(listener: (value: DesktopState) => void): () => void;
  command?(value: TrayCommand): Promise<void>;
  ready(): void; pointer(interactive: boolean): void; move(dx: number, dy: number): void;
  action(action: 'hide' | 'open' | 'settings'): void;
} } }
export function normalizeConfig(value: unknown, previous = DEFAULT_CONFIG): Config {
  if (!value || typeof value !== 'object') throw new Error('配置必须是对象');
  const data = value as Partial<Config>;
  if (data.selected !== undefined && (typeof data.selected !== 'string' || !/^(builtin|custom):[\w-]+$|^[\w-]+$/.test(data.selected))) throw new Error('宠物标识无效');
  if (data.visible !== undefined && typeof data.visible !== 'boolean') throw new Error('显示状态无效');
  if (data.size !== undefined && (!Number.isFinite(data.size) || data.size < 64 || data.size > 224)) throw new Error('宠物大小须为 64–224');
  if (data.position !== undefined && data.position !== null && (!Number.isFinite(data.position.x) || !Number.isFinite(data.position.y) || data.position.x < 0 || data.position.x > 1 || data.position.y < 0 || data.position.y > 1)) throw new Error('位置无效');
  return { selected: data.selected ?? previous.selected, visible: data.visible ?? previous.visible, size: data.size ?? previous.size, position: data.position === undefined ? previous.position : data.position };
}
export interface SessionState { id: string; title?: string; running: boolean; waiting?: boolean; error?: string | null; completed?: boolean }
/** 优先提醒需要用户处理的任务；动画互动不会更改业务状态。 */
export function selectActivity(sessions: readonly SessionState[], current?: string): Activity {
  const ordered = [...sessions].sort((a, b) => Number(b.id === current) - Number(a.id === current));
  const target = ordered.find(s => s.waiting) ?? ordered.find(s => s.error) ?? ordered.find(s => s.completed) ?? ordered.find(s => s.running);
  if (!target) return IDLE;
  return { pose: target.waiting ? 'waiting' : target.error ? 'failed' : target.completed ? 'review' : 'running', title: target.title ?? '当前任务', text: target.waiting ? '等待你处理' : target.error ? '任务出错了' : target.completed ? '已完成，待你查看' : '正在工作', sessionId: target.id };
}
/** v2 的最后两行是顺时针 16 方向注视，0 表示上方。 */
export function lookCell(dx: number, dy: number): { row: number; col: number } | null {
  if (Math.hypot(dx, dy) < 28) return null;
  const index = Math.round(((Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 8)) % 16;
  return { row: 9 + Math.floor(index / 8), col: index % 8 };
}
