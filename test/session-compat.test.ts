import test from 'node:test';
import assert from 'node:assert/strict';
import { compatibleSessions } from '../src/session-compat.ts';
import type { Sessions } from '../src/activity.ts';
import type { CreationSessions } from '../src/creation.ts';

test('旧版时间线不重播历史完成，增量保留取消原因并复用绑定', () => {
  const start = { seq: 1, type: 'turn/start' };
  const turns = new Map<number, any>([[1, { start, end: { seq: 2, type: 'turn/end', data: { reason: { kind: 'completed' } } } }]]);
  const binding = { session: { getSnapshot: () => ({ chat: { timeline: { turns } } }), subscribe: () => () => {} } };
  const raw = { list: {}, binding: () => binding, open() {}, async create() { return 's'; } } as unknown as Sessions & CreationSessions;
  const sessions = compatibleSessions(raw);
  const adapted = sessions.binding('s')!;
  assert.equal(adapted, sessions.binding('s'));
  assert.equal(adapted.eventSource.getSnapshot().change.kind, 'replace');
  turns.set(2, { start: { seq: 3, type: 'turn/start' }, end: { seq: 4, type: 'turn/end', data: { reason: { kind: 'cancelled' } } } });
  const snapshot = adapted.eventSource.getSnapshot();
  assert.equal(snapshot.change.kind, 'append');
  assert.equal(snapshot.change.entries.length, 2);
  assert.equal(snapshot.change.entries[1].event.data?.reason?.kind, 'cancelled');
  assert.equal(adapted.eventSource.getSnapshot(), snapshot);
  const modern = { ...binding, eventSource: adapted.eventSource };
  const newer = compatibleSessions({ ...raw, binding: () => modern } as unknown as Sessions & CreationSessions);
  assert.equal(newer.binding('s'), modern);
});

test('旧版冷会话随后加载历史时不伪造完成事件', () => {
  let state: any = { openState: 'cold', chat: { timeline: { turns: new Map() } } };
  const binding = { session: { getSnapshot: () => state, subscribe: () => () => {} } };
  const sessions = compatibleSessions({ list: {}, binding: () => binding } as unknown as Sessions & CreationSessions);
  const source = sessions.binding('s')!.eventSource;
  source.getSnapshot();
  state = { openState: 'open', chat: { timeline: { turns: new Map([[1, { end: { seq: 20, type: 'turn/end', data: { reason: { kind: 'completed' } } } }]]) } } };
  assert.equal(source.getSnapshot().change.kind, 'replace');
});
