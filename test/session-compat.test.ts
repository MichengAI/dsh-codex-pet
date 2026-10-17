import test from 'node:test';
import assert from 'node:assert/strict';
import { compatibleSessions } from '../src/session-compat.ts';
import { selectedSessionId, type Sessions } from '../src/activity.ts';

test('打开会话只走传入的导航，不再回退宿主 sessions.open', () => {
  const opened: string[] = [];
  const withNavigate = compatibleSessions({
    list: {},
    binding: () => undefined,
    async create() { return 's'; },
  } as unknown as Sessions, id => opened.push(id));
  withNavigate.open!('s1');
  assert.deepEqual(opened, ['s1']);
  const missing = compatibleSessions({
    list: {},
    binding: () => undefined,
    open(id: string) { opened.push(`host:${id}`); },
    async create() { return 's'; },
  } as unknown as Sessions);
  assert.equal(missing.open, undefined);
  assert.deepEqual(opened, ['s1']);
});

test('binding 缺失时用 retain 补观察引用，离开目录后释放', () => {
  const released: string[] = [];
  const session = { getSnapshot: () => ({ running: false, lastAgentError: 'boom' }), subscribe: () => () => {} };
  const eventSource = { getSnapshot: () => ({ revision: 0, change: { kind: 'replace', entries: [] } }), subscribe: () => () => {} };
  const list = { ids: ['s1'], byId: { s1: { id: 's1', running: false } } };
  const listeners = new Set<() => void>();
  const sessions = compatibleSessions({
    list: { getSnapshot: () => list, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); } },
    binding: () => undefined,
    retain(id: string, options: { source: string }) {
      assert.equal(id, 's1');
      assert.equal(options.source, 'controllerOperation');
      return { binding: { session, eventSource }, ready: Promise.resolve(), release() { released.push(id); } };
    },
  } as unknown as Sessions);
  const bound = sessions.binding('s1');
  assert.equal(bound?.session.getSnapshot().lastAgentError, 'boom');
  assert.equal(bound?.eventSource, eventSource);
  list.ids = [];
  for (const listener of listeners) listener();
  sessions.binding('gone');
  assert.deepEqual(released, ['s1']);
});

test('当前会话只认 retainedBy.mainView', () => {
  assert.equal(selectedSessionId({
    ids: ['a', 'b'],
    byId: { a: { id: 'a', running: false }, b: { id: 'b', running: true, retainedBy: { mainView: 1 } } },
  }), 'b');
  assert.equal(selectedSessionId({
    ids: ['a'],
    byId: { a: { id: 'a', running: true } },
  }), undefined);
});
