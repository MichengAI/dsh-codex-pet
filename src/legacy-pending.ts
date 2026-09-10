/** 旧版 runtime 将待处理请求放在会话快照，新版则由 uiSession 提供独立订阅。 */
import type { Sessions, SessionSnapshot, Store, PendingStore } from './activity.ts';
import type { Pending, Question, Answers } from './notifications.ts';

interface LegacyWait {
  kind: 'approval' | 'question'; key: string; sessionId: string;
  payload: { approvalId?: string; toolName?: string; reason?: string; questions?: readonly Question[] };
  respond(result: { ok: true; value: unknown }): Promise<{ accepted: boolean; reason?: string }>;
}
type LegacySnapshot = SessionSnapshot & { pending?: readonly LegacyWait[] };

/** 新版 uiSession 可能晚于插件激活；订阅期间跟随服务到达和替换。 */
export function compatiblePending(sessions: Sessions, resolveModern: () => PendingStore | undefined): PendingStore {
  const legacy = legacyPending(sessions);
  const listeners = new Set<() => void>();
  let source: PendingStore = legacy;
  let off: (() => void) | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  const notify = () => { for (const listener of listeners) listener(); };
  const sync = () => {
    const next = resolveModern() ?? legacy;
    if (next === source && off) return;
    off?.(); source = next;
    off = listeners.size ? source.subscribe(notify) : undefined;
    notify();
  };
  return {
    getSnapshot: () => source.getSnapshot(),
    subscribe(listener) {
      listeners.add(listener);
      if (!timer) { sync(); timer = setInterval(sync, 250); }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) { clearInterval(timer); timer = undefined; off?.(); off = undefined; }
      };
    },
  };
}

export function legacyPending(sessions: Sessions): Store<ReadonlyMap<string, Pending>> {
  const listeners = new Set<() => void>();
  const subscriptions = new Map<string, { source: Store<LegacySnapshot>; off: () => void }>();
  let snapshot: ReadonlyMap<string, Pending> = new Map();
  let offList: (() => void) | undefined;
  const refresh = () => {
    const list = sessions.list.getSnapshot();
    for (const [id, item] of subscriptions) if (!list.byId[id] || list.byId[id].origin === 'subagent') { item.off(); subscriptions.delete(id); }
    const next = new Map<string, Pending>();
    for (const id of list.ids) {
      if (list.byId[id]?.origin === 'subagent') continue;
      const source = sessions.binding(id)?.session as Store<LegacySnapshot> | undefined;
      if (!source) continue;
      if (listeners.size && subscriptions.get(id)?.source !== source) {
        subscriptions.get(id)?.off();
        subscriptions.set(id, { source, off: source.subscribe(refresh) });
      }
      const wait = source.getSnapshot().pending?.[0];
      if (!wait) continue;
      next.set(id, {
        kind: wait.kind, key: wait.key, sessionId: wait.sessionId, ...wait.payload,
        async answer(answer: unknown) {
          // 不响应已经替换的请求，也不借旧请求句柄操作另一个会话。
          if (wait.sessionId !== id || !source.getSnapshot().pending?.includes(wait)) throw new Error('请求已结束或已更换');
          // 旧宿主拒绝空 custom 字段，按官方旧版表单规则省略空白补充。
          const normalized = wait.kind === 'question' ? { answers: (answer as Answers).answers.map(({ custom, ...item }) => ({ ...item, ...(custom?.trim() ? { custom: custom.trim() } : {}) })) } : answer;
          const value = wait.kind === 'approval'
            ? { sessionId: id, approvalId: wait.payload.approvalId, outcome: answer }
            : { sessionId: id, answer: normalized };
          const receipt = await wait.respond({ ok: true, value });
          if (!receipt.accepted) throw new Error(receipt.reason ?? '宿主拒绝响应');
        },
      });
    }
    snapshot = next;
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      if (!offList) { offList = sessions.list.subscribe(refresh); refresh(); }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) { offList?.(); offList = undefined; for (const item of subscriptions.values()) item.off(); subscriptions.clear(); }
      };
    },
  };
}
