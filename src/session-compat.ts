/** 把宿主导航和会话状态接到插件内部的统一会话面。 */
import type { Sessions, Store, SessionStatusRow } from './activity.ts';
import type { CreationSessions } from './creation.ts';

type HostSessions = Omit<Sessions, 'open' | 'status'> & Partial<Pick<Sessions, 'status' | 'using' | 'create' | 'retain'>> & Partial<Pick<CreationSessions, 'create'>>;

export type SessionNavigate = (id: string) => unknown;

/** 宠物内部使用：收起宠物时可以主动释放为通知打开过的会话。 */
export type CompatibleSessions = Sessions & { releaseBindings(): void };

export function compatibleSessions(
  sessions: HostSessions,
  navigate?: SessionNavigate,
  status?: Store<ReadonlyMap<string, SessionStatusRow>>,
): CompatibleSessions {
  type Binding = NonNullable<ReturnType<Sessions['binding']>>;
  const refs = new Map<string, NonNullable<ReturnType<NonNullable<Sessions['retain']>>>>();
  const sweep = () => {
    const ids = new Set(sessions.list?.getSnapshot?.()?.ids ?? []);
    for (const [id, ref] of refs) if (!ids.has(id)) {
      try { ref.release(); } catch { /* 会话已不在目录 */ }
      refs.delete(id);
    }
  };
  const releaseBindings = () => {
    for (const id of [...refs.keys()]) releaseBinding(id);
  };
  // 收起宠物或会话冷却时调用：释放全部/单个 retain，避免历史、订阅与控制器常驻。
  function releaseBinding(id: string): void {
    const ref = refs.get(id);
    if (ref === undefined) return;
    try { ref.release(); } catch { /* 已释放 */ }
    refs.delete(id);
  }
  sessions.list?.subscribe?.(sweep);
  return {
    list: sessions.list,
    status: status ?? sessions.status,
    using: sessions.using?.bind(sessions),
    open: navigate,
    releaseBinding,
    releaseBindings,
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
