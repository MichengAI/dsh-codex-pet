/** 把宿主导航和会话状态接到插件内部的统一会话面。 */
import type { Sessions, Store, SessionStatusRow } from './activity.ts';
import type { CreationSessions } from './creation.ts';

type HostSessions = Omit<Sessions, 'open' | 'status'> & Partial<Pick<Sessions, 'status' | 'using' | 'create' | 'retain'>> & Partial<Pick<CreationSessions, 'create'>>;

export type SessionNavigate = (id: string) => unknown;

export function compatibleSessions(
  sessions: HostSessions,
  navigate?: SessionNavigate,
  status?: Store<ReadonlyMap<string, SessionStatusRow>>,
): Sessions {
  type Binding = NonNullable<ReturnType<Sessions['binding']>>;
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
    open: navigate,
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
      return binding as Binding | undefined;
    },
  };
}
