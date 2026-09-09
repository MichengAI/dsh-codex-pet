import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryStore } from '../src/library-store.ts';
import { DEFAULT_CONFIG, type Library } from '../src/model.ts';

test('多个订阅共享轮询，无变化不发布，旧读取不能覆盖写入，最后退订释放轮询', async context => {
  context.mock.timers.enable({ apis: ['setInterval'] });
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: Object.assign(new EventTarget(), { hidden: false }) });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  const library: Library = { pets: [], config: DEFAULT_CONFIG, customPath: '', warnings: [], skillAvailable: false, skillPath: '', creationAvailable: false, creation: null };
  let reads = 0, notifications = 0, pending: ((value: Library) => void) | undefined;
  let holdWrite = false, finishWrite: (() => void) | undefined;
  const store = createLibraryStore(async path => {
    if (path === 'config') {
      if (holdWrite) await new Promise<void>(done => { finishWrite = done; });
      return { ...library, config: { ...library.config, size: 180 } };
    }
    reads++; if (reads === 3) return new Promise(done => { pending = done; });
    return structuredClone(library);
  });
  const flush = () => new Promise(done => setImmediate(done));
  const off1 = store.subscribe(() => notifications++), off2 = store.subscribe(() => notifications++);
  try {
    await flush(); assert.equal(reads, 1); assert.equal(notifications, 2);
    context.mock.timers.tick(2500); await flush(); assert.equal(reads, 2); assert.equal(notifications, 2);
    context.mock.timers.tick(2500); await flush();
    await store.run('config', { size: 180 });
    pending!(library); await flush(); assert.equal(store.getSnapshot().library?.config.size, 180);
    holdWrite = true;
    const writing = store.run('config', { size: 180 });
    context.mock.timers.tick(2500); await flush(); assert.equal(reads, 3, '写入期间不读取旧配置');
    finishWrite!(); await writing;
    off1(); off2(); context.mock.timers.tick(5000); await flush(); assert.equal(reads, 3);
  } finally {
    off1(); off2();
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else Reflect.deleteProperty(globalThis, 'document');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
});
