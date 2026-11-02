/** 把宿主导航和会话状态接到插件内部的统一会话面。 */
import type { Sessions, Store, SessionStatusRow } from './activity.ts';
import type { CreationSessions } from './creation.ts';

type HostSessions = Omit<Sessions, 'open' | 'status'> & Partial<Pick<Sessions, 'status' | 'using' | 'create' | 'retain'>> & Partial<Pick<CreationSessions, 'create'>>;

export type SessionNavigate = (id: string) => unknown;

/** retain 的用途归属：通知引擎与创建流程各自持有，互不释放对方的引用。 */
export type RetainOwner = 'pet' | 'creation';
const DEFAULT_OWNER: RetainOwner = 'pet';

/** 宠物内部使用：收起宠物时可以主动释放通知引擎为会话建立的 retain。 */
export type CompatibleSessions = Sessions & {
  binding(id: string, owner?: RetainOwner): ReturnType<Sessions['binding']>;
  releaseBinding(id: string, owner?: RetainOwner): void;
  releaseBindings(owner?: RetainOwner): void;
  /** 清理已离开目录的 retain：由调用方按轮次触发一次，而不是每次取绑定都全量扫。 */
  sweepBindings(): void;
};

export function compatibleSessions(
  sessions: HostSessions,
  navigate?: SessionNavigate,
  status?: Store<ReadonlyMap<string, SessionStatusRow>>,
): CompatibleSessions {
  type Binding = NonNullable<ReturnType<Sessions['binding']>>;
  type RetainRef = NonNullable<ReturnType<NonNullable<Sessions['retain']>>>;
  /** 每个被打开的会话只有一份 retain，但可能同时被多个用途持有。 */
  interface Held { ref: RetainRef; owners: Set<RetainOwner> }
  const held = new Map<string, Held>();
  const drop = (id: string): void => {
    const entry = held.get(id);
    if (entry === undefined) return;
    try { entry.ref.release(); } catch { /* 会话已不在目录或已释放 */ }
    held.delete(id);
  };
  const sweep = () => {
    // 没有 retain 时不必读快照，更不必建一份全量 id 集合。
    if (held.size === 0) return;
    const ids = new Set(sessions.list?.getSnapshot?.()?.ids ?? []);
    for (const id of [...held.keys()]) if (!ids.has(id)) drop(id);
  };
  // 收起宠物时调用：只释放通知引擎的引用，创建流程持有的会话不受影响。
  const releaseBindings = (owner: RetainOwner = DEFAULT_OWNER) => {
    for (const [id, entry] of [...held]) {
      entry.owners.delete(owner);
      if (entry.owners.size === 0) drop(id);
    }
  };
  // 会话冷却时调用：同样只摘掉本用途的持有，仍有其它用途时不关闭控制器。
  function releaseBinding(id: string, owner: RetainOwner = DEFAULT_OWNER): void {
    const entry = held.get(id);
    if (entry === undefined) return;
    entry.owners.delete(owner);
    if (entry.owners.size === 0) drop(id);
  }
  sessions.list?.subscribe?.(sweep);
  return {
    list: sessions.list,
    status: status ?? sessions.status,
    using: sessions.using?.bind(sessions),
    open: navigate,
    releaseBinding,
    releaseBindings,
    sweepBindings: sweep,
    create: options => {
      if (!sessions.create) throw new Error('创建会话尚不可用，请重试');
      return sessions.create(options);
    },
    binding(id: string, owner: RetainOwner = DEFAULT_OWNER) {
      let binding = sessions.binding(id);
      if (!binding && sessions.retain) {
        let entry = held.get(id);
        if (!entry) {
          try {
            entry = { ref: sessions.retain(id, { source: 'controllerOperation' }), owners: new Set<RetainOwner>() };
            held.set(id, entry);
          } catch { return undefined; }
        }
        entry.owners.add(owner);
        binding = entry.ref.binding;
      }
      return binding as Binding | undefined;
    },
  };
}
