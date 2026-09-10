/** 将旧版公开 Chat 时间线转换为通知需要的事件增量，保留真实结束原因。 */
import type { Sessions, EventWindow, SessionSnapshot } from './activity.ts';
import type { CreationSessions } from './creation.ts';
type Boundary = { seq: number } & EventWindow['change']['entries'][number]['event'];
type TimelineSnapshot = SessionSnapshot & { openState?: string; chat?: { timeline: { turns: ReadonlyMap<number, { start?: Boundary; end?: Boundary }> } } };

export function compatibleSessions(sessions: Sessions & CreationSessions): Sessions & CreationSessions {
  type Binding = NonNullable<ReturnType<Sessions['binding']>> & NonNullable<ReturnType<CreationSessions['binding']>>;
  const cache = new WeakMap<object, Binding>();
  return {
    list: sessions.list,
    open: id => sessions.open(id),
    create: options => sessions.create(options),
    binding(id) {
      const binding = sessions.binding(id) as Binding | undefined;
      if (!binding || binding.eventSource) return binding;
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
