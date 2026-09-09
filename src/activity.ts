/** 适配 DSH 当前公共快照；交互请求由 uiSession 的独立订阅提供。 */
export interface Store<T> { getSnapshot(): T; subscribe(listener: () => void): () => void }
interface Summary { id: string; origin?: string; displayTitle?: string; title?: string; running: boolean; completed?: boolean; updatedAt?: number; pendingInteraction?: unknown }
export interface SessionList { current?: string; ids: readonly string[]; byId: Record<string, Summary> }
export interface SessionSnapshot { running: boolean; lastAgentError: string | null }
export interface EventWindow { revision: number; change: { kind: string; entries: readonly { type: string; event: { type: string; data?: { reason?: { kind: string } } } }[] } }
export interface Sessions {
  list: Store<SessionList>;
  binding(id: string): { session: Store<SessionSnapshot> & { cancel?(): Promise<{ ok: boolean; error?: { message?: string } }> }; eventSource: Store<EventWindow> } | undefined;
  open(id: string): unknown;
}
export type PendingStore = Store<ReadonlyMap<string, { readonly kind?: unknown }>>;
