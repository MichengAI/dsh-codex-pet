/** 适配 DSH 0.2.0 起的公共快照：当前会话看 retainedBy.mainView，完成看 sessionStatus。 */
export interface Store<T> { getSnapshot(): T; subscribe(listener: () => void): () => void }
export interface SessionRetainBy { mainView?: number }
interface Summary { id: string; origin?: string; displayTitle?: string; title?: string; running: boolean; updatedAt?: number; pendingInteraction?: unknown; retainedBy?: SessionRetainBy }
export interface SessionList { ids: readonly string[]; byId: Record<string, Summary> }
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

/** 主视图是 retainedBy.mainView 大于 0 的会话。0.2.0 起目录没有 current。 */
export function selectedSessionId(list: SessionList): string | undefined {
  for (const id of list.ids) if ((list.byId[id]?.retainedBy?.mainView ?? 0) > 0) return id;
}
