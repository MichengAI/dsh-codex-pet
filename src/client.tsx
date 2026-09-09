import type { PetLocaleStore } from './pet-locales.ts';
/** 只通过 DSH 公共插槽与 Session 快照接入，独立于其他宠物插件。 */
import React, { useEffect, useState, useRef } from 'react';
import { Companion, Settings, usePetController } from './ui.tsx';
import { IDLE, type Activity } from './model.ts';
import { type Sessions, type PendingStore } from './activity.ts';
import { createNotifications, type NotificationState } from './notifications.ts';
import type { TrayCommand } from './notification-tray.tsx';
import { createPetSession, type CreationSessions } from './creation.ts';
import { observePetSettingsIcon } from './settings-icon.ts';
interface ClientContext { locale: PetLocaleStore; sessions: Sessions & CreationSessions; uiSession: { pendingInteractions: PendingStore }; slots: { inject(name: string, register: () => () => void): void; register(options: { name: string; id: string; order?: number; label?: string }, component: () => React.ReactElement): () => void } }
export const name = 'michengai-codex-pet';
export const inject = ['slots', 'sessions', 'uiSession', 'locale'];
function openSettings(): void {
  const trigger = document.querySelector('[data-dcu-settings-trigger]');
  if (trigger) trigger.dispatchEvent(new CustomEvent('dcu-settings-open-section', { bubbles: true, cancelable: true, detail: { labels: ['宠物'] } }));
  else window.dispatchEvent(new Event('dcp-open-settings'));
}
function Overlay({ sessions, pending, locale }: { sessions: Sessions & CreationSessions; pending: PendingStore; locale: PetLocaleStore }) {
  const controller = usePetController(locale);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const show = () => { if (!settingsDialog.current?.open) settingsDialog.current?.showModal(); }; window.addEventListener('dcp-open-settings', show); return () => window.removeEventListener('dcp-open-settings', show); }, []);
  const [state, setState] = useState<NotificationState>({ items: [], activity: IDLE, hidden: 0 });
  const notifications = useRef<ReturnType<typeof createNotifications> | null>(null);
  useEffect(() => { const engine = createNotifications(sessions, pending, setState); notifications.current = engine; return () => { notifications.current = null; engine.dispose(); }; }, [sessions, pending]);
  useEffect(observePetSettingsIcon, []);
  const command = async (value: TrayCommand) => {
    const engine = notifications.current;
    if (!engine) throw new Error('会话服务尚未就绪');
    if (value.type === 'sort') { engine.sort(value.latest); return; }
    await engine.command(value);
  };
  return <><Companion controller={controller} activity={state.activity} tray={{ state, command }} open={() => { if (state.activity.sessionId) sessions.open(state.activity.sessionId); }} settings={openSettings} /><dialog ref={settingsDialog} className="dcp dcp-dialog" aria-label="宠物设置" style={{ width: "min(800px, calc(100vw - 32px))", maxHeight: "85vh", overflow: "auto" }}><button type="button" className="dcp-button" onClick={() => settingsDialog.current?.close()}>关闭设置</button><Page sessions={sessions} locale={locale} /></dialog></>;
}
function Page({ sessions, locale }: { sessions: CreationSessions; locale: PetLocaleStore }) { const controller = usePetController(locale); return <Settings controller={controller} locale={locale} create={async description => { const library = controller.library; if (!library) throw new Error('宠物库尚未加载'); await createPetSession(sessions, description, library.customPath, library.skillPath); }} />; }
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'codex-pet', label: '宠物', order: 12 }, () => <Page sessions={ctx.sessions} locale={ctx.locale} />));
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'michengai-codex-pet', order: 100 }, () => <Overlay sessions={ctx.sessions} pending={ctx.uiSession.pendingInteractions} locale={ctx.locale} />));
}
