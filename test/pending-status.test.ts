import assert from 'node:assert/strict';
import test from 'node:test';
import { pendingFromSessionStatus } from '../src/pending-status.ts';

test('sessionStatus 里的待处理请求可回答，清空后不再露出', async () => {
  const answers: unknown[] = [];
  const wait = {
    kind: 'approval',
    key: 'a1',
    sessionId: 's1',
    toolName: '终端',
    async answer(value: unknown) { answers.push(value); },
  };
  let snapshot = new Map<string, { pendingInteraction?: typeof wait }>([['s1', { pendingInteraction: wait }]]);
  const listeners = new Set<() => void>();
  const status = {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
  };
  const store = pendingFromSessionStatus(status);
  const off = store.subscribe(() => {});
  const request = store.getSnapshot().get('s1')!;
  await request.answer!('allowed-once');
  assert.deepEqual(answers, ['allowed-once']);
  snapshot = new Map();
  for (const listener of listeners) listener();
  assert.equal(store.getSnapshot().size, 0);
  off();
  assert.equal(listeners.size, 0);
});
