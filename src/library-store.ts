/** 同一页面共享宠物库快照与轮询，最后一个订阅离开时释放定时器。 */
import type { Library } from './model.ts';
type Snapshot = { library: Library | null; error: string };
export function createLibraryStore(request: (path: string, data?: unknown) => Promise<Library>) {
  let snapshot: Snapshot = { library: null, error: '' }, sequence = 0, mutations = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let reading: Promise<void> | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: Snapshot) => {
    if (JSON.stringify(snapshot) === JSON.stringify(next)) return;
    snapshot = next; for (const listener of listeners) listener();
  };
  const run = async (path: string, data?: unknown) => {
    const current = ++sequence;
    if (data !== undefined) mutations++;
    try { const library = await request(path, data); if (current === sequence) publish({ library, error: '' }); }
    catch (error) {
      if (current === sequence) publish({ ...snapshot, error: error instanceof Error ? error.message : '操作失败' });
      throw error;
    } finally { if (data !== undefined) mutations--; }
  };
  const read = () => {
    if (document.hidden || reading || mutations) return;
    reading = run('state').catch(() => {}).finally(() => { reading = undefined; });
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        read(); timer = setInterval(read, 2500);
        window.addEventListener('focus', read); document.addEventListener('visibilitychange', read);
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          clearInterval(timer); window.removeEventListener('focus', read); document.removeEventListener('visibilitychange', read);
        }
      };
    },
    run,
  };
}
