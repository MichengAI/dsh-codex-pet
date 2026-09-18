/** 适配 DSH 公共快照；alpha.2 用 sessionStatus / retainedBy，旧宿主回退 list.current 与 completed。 */
export interface Store<T> { getSnapshot(): T; subscribe(listener: () => void): () => void }
export interface SessionRetainBy { mainView?: number }
interface Summary { id: string; origin?: string; displayTitle?: string; title?: string; running: boolean; completed?: boolean; updatedAt?: number; pendingInteraction?: unknown; retainedBy?: SessionRetainBy }
export interface SessionList { current?: string; ids: readonly string[]; byId: Record<string, Summary> }
export interface SessionSnapshot { running: boolean; lastAgentError: string | null; promptError?: { error?: { message?: string } } | null }
export interface EventWindow { revision: number; change: { kind: string; entries: readonly { type: string; event: { type: string; data?: { reason?: { kind: string } } } }[] } }
export interface SessionStatusRow { running?: boolean; pendingInteraction?: unknown; completionUnread?: boolean }
export interface Sessions {
  list: Store<SessionList>;
  binding(id: string): {
    session: Store<SessionSnapshot> & {
      cancel?(): Promise<{ ok: boolean; error?: { message?: string } }>;
      prompt?(content: { type: 'text'; text: string }[], mode: 'queue'): Promise<{ ok: boolean; error?: { message?: string } }>;
    };
    eventSource?: Store<EventWindow>;
  } | undefined;
  open?(id: string): unknown;
  using?(
    id: string,
    options: { source: string },
    operation: (reference: { ready: Promise<unknown>; binding: { session: { prompt(content: { type: 'text'; text: string }[], mode: 'queue'): Promise<{ ok: boolean; error?: { message?: string } }> } } }) => unknown,
  ): Promise<unknown>;
  retain?(id: string, options: { source: string }): {
    binding: NonNullable<ReturnType<Sessions['binding']>>;
    ready: Promise<unknown>;
    release(): void;
  };
  create?(options?: { cwd?: string }): Promise<string>;
  status?: Store<ReadonlyMap<string, SessionStatusRow>>;
}
export type PendingStore = Store<ReadonlyMap<string, { readonly kind?: unknown; readonly key?: string; answer?: (value: unknown) => Promise<void> }>>;

/** 主视图优先看 mainView retain；旧宿主没有该标记时回退 list.current。 */
export function selectedSessionId(list: SessionList): string | undefined {
  for (const id of list.ids) if ((list.byId[id]?.retainedBy?.mainView ?? 0) > 0) return id;
  return list.current;
}
