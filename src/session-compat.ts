/** 把新旧宿主的导航、状态和旧版 Chat 时间线接到插件内部的统一会话面。 */
import type { Sessions, EventWindow, SessionSnapshot, Store, SessionStatusRow } from './activity.ts';
import type { CreationSessions } from './creation.ts';

type Boundary = { seq: number } & EventWindow['change']['entries'][number]['event'];
type TimelineSnapshot = SessionSnapshot & { openState?: string; chat?: { timeline: { turns: ReadonlyMap<number, { start?: Boundary; end?: Boundary }> } } };
type HostSessions = Omit<Sessions, 'open' | 'status'> & Partial<Pick<Sessions, 'open' | 'status' | 'using' | 'create' | 'retain'>> & Partial<Pick<CreationSessions, 'create'>>;

export type SessionNavigate = (id: string) => unknown;

export function compatibleSessions(
  sessions: HostSessions,
  navigate?: SessionNavigate,
  status?: Store<ReadonlyMap<string, SessionStatusRow>>,
): Sessions {
  type Binding = NonNullable<ReturnType<Sessions['binding']>>;
  const cache = new WeakMap<object, Binding>();
  const refs = new Map<string, NonNullable<ReturnType<NonNullable<Sessions['retain']>>>>();
  const sweep = () => {
    const ids = new Set(sessions.list?.getSnapshot?.()?.ids ?? []);
    for (const [id, ref] of refs) if (!ids.has(id)) {
      try { ref.release(); } catch { /* 会话已不在目录 */ }
      refs.delete(id);
    }
  };
  sessions.list?.subscribe?.(sweep);
  return {
    list: sessions.list,
    status: status ?? sessions.status,
    using: sessions.using?.bind(sessions),
    open: id => navigate ? navigate(id) : sessions.open?.(id),
    create: options => {
      if (!sessions.create) throw new Error('创建会话尚不可用，请重试');
      return sessions.create(options);
    },
    binding(id) {
      sweep();
      let binding = sessions.binding(id);
      if (!binding && sessions.retain) {
        let ref = refs.get(id);
        if (!ref) {
          try { ref = sessions.retain(id, { source: 'controllerOperation' }); refs.set(id, ref); }
          catch { return undefined; }
        }
        binding = ref.binding;
      }
      if (!binding || binding.eventSource) return binding as Binding | undefined;
      const cached = cache.get(binding);
      if (cached) return cached;
      let lastSeq = -1, initialized = false;
      let snapshot: EventWindow = { revision: 0, change: { kind: 'replace', entries: [] } };
      const eventSource = {
        getSnapshot() {
          const state = binding.session.getSnapshot() as TimelineSnapshot;
          if (state.openState === 'cold' || state.openState === 'loading') initialized = false;
          const events = [...(state.chat?.timeline.turns.values() ?? [])]
            .flatMap(turn => [turn.start, turn.end]).filter((entry): entry is Boundary => !!entry).sort((a, b) => a.seq - b.seq);
          const additions = events.filter(entry => entry.seq > lastSeq);
          if (additions.length) {
            lastSeq = additions.at(-1)!.seq;
            snapshot = { revision: snapshot.revision + 1, change: { kind: initialized ? 'append' : 'replace', entries: additions.map(entry => ({ type: 'event', event: entry })) } };
          }
          initialized = state.openState === undefined || state.openState === 'open';
          return snapshot;
        },
        subscribe: (listener: () => void) => binding.session.subscribe(listener),
      };
      const adapted = { ...binding, eventSource };
      cache.set(binding, adapted);
      return adapted;
    },
  };
}
