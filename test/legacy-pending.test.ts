import assert from 'node:assert/strict';
import test from 'node:test';
import { legacyPending, compatiblePending } from '../src/legacy-pending.ts';
import type { Sessions, PendingStore } from '../src/activity.ts';

test('旧版请求保留身份和响应协议，拒绝过期或被宿主拒绝的回答，卸载释放订阅', async () => {
  const listeners = new Set<() => void>();
  const listListeners = new Set<() => void>();
  const responses: unknown[] = [];
  let accepted = true;
  const question = { kind: 'question', key: 'question:q1', sessionId: 's1', payload: { questions: [{ id: 'q1', question: '颜色？' }] },
    async respond(value: unknown) { responses.push(value); return { accepted, reason: '已结束' }; } };
  let waits: any[] = [question];
  const sessions = {
    list: { getSnapshot: () => ({ ids: ['s1', 'child'], byId: { s1: { id: 's1' }, child: { id: 'child', origin: 'subagent' } } }), subscribe(fn: () => void) { listListeners.add(fn); return () => listListeners.delete(fn); } },
    binding(id: string) {
      assert.equal(id, 's1');
      return { session: source };
    },
  };
  const source = { getSnapshot: () => ({ running: true, lastAgentError: null, pending: waits }), subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); } };
  const store = legacyPending(sessions as unknown as Sessions);
  const off = store.subscribe(() => {});
  const request = store.getSnapshot().get('s1')!;
  await request.answer!({ answers: [{ id: 'q1', selected: ['蓝色'], custom: '' }] });
  assert.deepEqual(responses[0], { ok: true, value: { sessionId: 's1', answer: { answers: [{ id: 'q1', selected: ['蓝色'] }] } } });
  accepted = false;
  await assert.rejects(request.answer!({ answers: [] }), /已结束/);
  waits = [{ ...question, kind: 'approval', key: 'approval:a1', payload: { approvalId: 'a1' } }];
  for (const fn of listeners) fn();
  await assert.rejects(request.answer!({}), /请求已结束/);
  accepted = true;
  await store.getSnapshot().get('s1')!.answer!('allowed-once');
  assert.deepEqual(responses.at(-1), { ok: true, value: { sessionId: 's1', approvalId: 'a1', outcome: 'allowed-once' } });
  waits = [];
  for (const fn of listeners) fn();
  assert.equal(store.getSnapshot().size, 0);
  off();
  assert.equal(listeners.size, 0);
  assert.equal(listListeners.size, 0);
});

test('uiSession 延迟到达和替换时切换订阅，最后卸载不残留轮询', t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let modern: PendingStore | undefined;
  let active = 0;
  const make = (id: string): PendingStore => ({ getSnapshot: () => new Map([[id, { kind: 'question' }]]), subscribe() { active++; return () => { active--; }; } });
  const sessions = { list: { getSnapshot: () => ({ ids: [], byId: {} }), subscribe: () => () => {} } } as unknown as Sessions;
  const store = compatiblePending(sessions, () => modern);
  const off = store.subscribe(() => {});
  assert.equal(store.getSnapshot().size, 0);
  modern = make('one');
  t.mock.timers.tick(250);
  assert.ok(store.getSnapshot().has('one'));
  modern = make('two');
  t.mock.timers.tick(250);
  assert.ok(store.getSnapshot().has('two'));
  assert.equal(active, 1);
  off();
  t.mock.timers.tick(500);
  assert.equal(active, 0);
});
