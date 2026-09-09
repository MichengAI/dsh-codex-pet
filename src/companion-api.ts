/** 插件提供的单向接入接口；消费者自行实现窗口、IPC 和生命周期。 */
import type { Config, Pet } from './model.ts';
import type { NotificationState } from './notifications.ts';
import type { TrayCommand } from './notification-tray.tsx';
export interface CompanionSnapshot {
  pet: Pet | null;
  config: Config;
  language: string;
  notifications: NotificationState;
}
export interface CompanionApi {
  readonly version: 1;
  getSnapshot(): CompanionSnapshot | null;
  subscribe(listener: (snapshot: CompanionSnapshot | null) => void): () => void;
  command(value: TrayCommand): Promise<void>;
  updateConfig(value: Partial<Config>): Promise<void>;
  openSettings(): void;
  /** 接管展示时隐藏页内宠物；释放最后一个接管句柄后恢复。 */
  acquireDisplay(): () => void;
}
export function createCompanionProvider(handlers: Pick<CompanionApi, 'command' | 'updateConfig' | 'openSettings'> & { externalDisplay(value: boolean): void }) {
  let snapshot: CompanionSnapshot | null = null, active = true, displays = 0, signature = 'null';
  const listeners = new Set<(value: CompanionSnapshot | null) => void>();
  const check = () => { if (!active) throw new Error('宠物接口已卸载'); };
  const publish = (value: CompanionSnapshot | null) => {
    const next = JSON.stringify(value);
    if (next === signature) return;
    signature = next; snapshot = structuredClone(value);
    for (const listener of listeners) {
      try { listener(structuredClone(snapshot)); } catch (error) { console.error('宠物状态订阅失败', error); }
    }
  };
  const api: CompanionApi = Object.freeze({
    version: 1 as const,
    getSnapshot: () => structuredClone(snapshot),
    subscribe(listener: (value: CompanionSnapshot | null) => void) { check(); listeners.add(listener); return () => { listeners.delete(listener); }; },
    async command(value: TrayCommand) { check(); await handlers.command(value); },
    async updateConfig(value: Partial<Config>) { check(); await handlers.updateConfig(value); },
    openSettings() { check(); handlers.openSettings(); },
    acquireDisplay() {
      check(); displays++; handlers.externalDisplay(true);
      let released = false;
      return () => { if (released || !active) return; released = true; displays--; handlers.externalDisplay(displays > 0); };
    },
  });
  return { api, publish(value: CompanionSnapshot | null) { check(); publish(value); }, dispose() { if (!active) return; active = false; publish(null); listeners.clear(); handlers.externalDisplay(false); } };
}
declare global { interface Window { dshPet?: CompanionApi } }
