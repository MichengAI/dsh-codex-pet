/** 从 uiSession.sessionStatus 投影通知可用的待处理请求。 */
import type { Store, PendingStore, SessionStatusRow } from './activity.ts';
import type { Pending } from './notifications.ts';

type PendingLike = Pending & { answer?: (value: unknown) => Promise<void> };

export function pendingFromSessionStatus(status: Store<ReadonlyMap<string, SessionStatusRow>>): PendingStore {
  return {
    getSnapshot() {
      const next = new Map<string, PendingLike>();
      for (const [id, row] of status.getSnapshot()) {
        const wait = row.pendingInteraction;
        if (!wait || typeof wait !== 'object') continue;
        const item = wait as PendingLike;
        next.set(String(id), {
          kind: item.kind,
          key: item.key,
          sessionId: item.sessionId ?? String(id),
          toolName: item.toolName,
          reason: item.reason,
          questions: item.questions,
          answer: typeof item.answer === 'function' ? item.answer.bind(item) : undefined,
        });
      }
      return next;
    },
    subscribe: listener => status.subscribe(listener),
  };
}
