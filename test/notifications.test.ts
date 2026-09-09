import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotifications, validateAnswers, type Pending, type NotificationState } from '../src/notifications.ts';
import type { Store, SessionList, SessionSnapshot, EventWindow } from '../src/activity.ts';
class State<T> implements Store<T> {
  listeners = new Set<() => void>(); constructor(public value: T) {}
  getSnapshot = () => this.value;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  set(value: T) { this.value = value; for (const listener of [...this.listeners]) listener(); }
}
function setup() {
  const list = new State<SessionList>({ current: 'a', ids: ['a', 'b'], byId: { a: { id: 'a', title: '甲', running: true }, b: { id: 'b', title: '乙', running: true } } });
  const pending = new State<ReadonlyMap<string, Pending>>(new Map());
  const bindings = Object.fromEntries(['a', 'b'].map(id => [id, { session: new State<SessionSnapshot>({ running: true, lastAgentError: null }), eventSource: new State<EventWindow>({ revision: 0, change: { kind: 'replace', entries: [] } }) }]));
  let state!: NotificationState; let opened = ''; let now = 100;
  const engine = createNotifications({ list, binding: id => bindings[id], open(id) { opened = id; } }, pending, value => { state = value; }, () => now);
  return { engine, list, pending, bindings, get state() { return state; }, get opened() { return opened; }, tick(n: number) { now += n; list.set(list.value); } };
}
test('保留多个会话，切换不丢完成通知，关闭不停止任务，新轮次重新提醒', async () => {
  const x = setup();
  try {
    assert.equal(x.state.items.length, 2);
    const a = x.state.items.find(i => i.id === 'a')!;
    await x.engine.command({ type: 'dismiss', id: a.id, token: a.token });
    assert.deepEqual(x.state.items.map(i => i.id), ['b']); assert.equal(x.bindings.a.session.value.running, true);
    x.bindings.b.eventSource.set({ revision: 1, change: { kind: 'append', entries: [{ type: 'event', event: { type: 'turn/end', data: { reason: { kind: 'completed' } } } }] } });
    x.list.set({ ...x.list.value, current: 'b', byId: { ...x.list.value.byId, b: { id: 'b', running: false, completed: true } } });
    x.bindings.b.session.set({ running: false, lastAgentError: null });
    assert.equal(x.state.items[0].pose, 'review');
    x.list.set({ ...x.list.value, current: 'a' }); x.tick(13000);
    assert.equal(x.state.items[0].pose, 'review');
    x.bindings.a.session.set({ running: false, lastAgentError: null });
    x.bindings.a.session.set({ running: true, lastAgentError: null });
    assert.ok(x.state.items.some(i => i.id === 'a'));
    await assert.rejects(x.engine.command({ type: 'dismiss', id: a.id, token: a.token }), /更新/);
    x.list.set({ current: 'a', ids: ['a'], byId: { a: x.list.value.byId.a } });
    assert.equal(x.bindings.b.session.listeners.size, 0);
  } finally { x.engine.dispose(); assert.equal(x.list.listeners.size, 0); assert.equal(x.bindings.a.session.listeners.size, 0); }
});
test('审批绑定请求和会话，拒绝陈旧请求及双击；关闭通知不代审批', async () => {
  const x = setup(); const decisions: unknown[] = []; let release!: () => void;
  try {
    x.pending.set(new Map([['b', { kind: 'approval', key: 'one', sessionId: 'b', answer: async v => { decisions.push(v); await new Promise<void>(done => { release = done; }); } }]]));
    const item = x.state.items[0]; assert.equal(item.id, 'b'); assert.equal(item.pose, 'waiting');
    const cmd = { type: 'approve' as const, id: item.id, token: item.token, requestKey: 'one' };
    const first = x.engine.command(cmd);
    await assert.rejects(x.engine.command(cmd), /重复/); release(); await first;
    assert.deepEqual(decisions, ['allowed-once']); await assert.rejects(x.engine.command(cmd), /已经提交/);
    x.pending.set(new Map([['b', { kind: 'approval', key: 'two', sessionId: 'b', answer: async v => { decisions.push(v); } }]]));
    await assert.rejects(x.engine.command(cmd), /更新/);
    const next = x.state.items[0]; await x.engine.command({ type: 'dismiss', id: next.id, token: next.token });
    assert.equal(decisions.length, 1); await x.engine.command({ type: 'restore' }); assert.equal(x.state.items[0].pose, 'waiting');
  } finally { x.engine.dispose(); }
});
test('结构化回答保留选项原文，校验漏答、重复、多选与自定义文本', () => {
  const questions = [{ id: 'q', question: '确认计划', options: [{ label: '实施计划' }, { label: '先修改' }] }];
  const value = { answers: [{ id: 'q', selected: ['实施计划'] }] };
  assert.deepEqual(validateAnswers(questions, value), value);
  assert.throws(() => validateAnswers(questions, { answers: [] }));
  assert.throws(() => validateAnswers(questions, { answers: [{ id: 'q', selected: ['伪造选项'] }] }));
  assert.throws(() => validateAnswers(questions, { answers: [{ id: 'q', selected: ['实施计划'], custom: '冲突' }] }));
  assert.doesNotThrow(() => validateAnswers([{ ...questions[0], multiSelect: true }], { answers: [{ id: 'q', selected: ['实施计划', '先修改'], custom: '补充' }] }));
});
test('连续排队轮次重新提醒，历史加载不触发完成，取消不会被 completed 摘要覆盖', async () => {
  const x = setup();
  try {
    const item = x.state.items.find(i => i.id === 'a')!;
    await x.engine.command({ type: 'dismiss', id: item.id, token: item.token });
    x.bindings.a.eventSource.set({ revision: 1, change: { kind: 'append', entries: [{ type: 'event', event: { type: 'turn/start' } }] } });
    assert.ok(x.state.items.some(i => i.id === 'a'));
    x.bindings.a.eventSource.set({ revision: 2, change: { kind: 'replace', entries: [{ type: 'event', event: { type: 'turn/end', data: { reason: { kind: 'completed' } } } }] } });
    x.bindings.a.session.set({ running: false, lastAgentError: null });
    assert.ok(!x.state.items.some(i => i.id === 'a'));
    x.bindings.a.session.set({ running: true, lastAgentError: null });
    x.bindings.a.eventSource.set({ revision: 3, change: { kind: 'append', entries: [{ type: 'event', event: { type: 'turn/end', data: { reason: { kind: 'aborted' } } } }] } });
    x.bindings.a.session.set({ running: false, lastAgentError: null });
    x.list.set({ ...x.list.value, byId: { ...x.list.value.byId, a: { id: 'a', running: false, completed: true } } });
    assert.ok(!x.state.items.some(i => i.id === 'a'));
  } finally { x.engine.dispose(); }
});
test('停止按钮只调用目标会话 cancel，并透传宿主拒绝', async () => {
  const x = setup(); let called = 0;
  try {
    Object.assign(x.bindings.b.session, { cancel: async () => { called++; return { ok: false, error: { message: '任务已结束' } }; } });
    const item = x.state.items.find(i => i.id === 'b')!;
    await assert.rejects(x.engine.command({ type: 'stop', id: item.id, token: item.token }), /任务已结束/);
    assert.equal(called, 1); assert.equal(x.bindings.a.session.value.running, true);
  } finally { x.engine.dispose(); }
});

test('子代理不产生通知、不绑定或操作；后补来源标记时清理已有订阅', async () => {
  const x = setup();
  try {
    const old = x.state.items.find(item => item.id === 'b')!;
    const child = { ...x.list.value.byId.b, origin: 'subagent' };
    x.list.set({ ...x.list.value, byId: { ...x.list.value.byId, b: child } });
    assert.deepEqual(x.state.items.map(item => item.id), ['a']);
    assert.equal(x.bindings.b.session.listeners.size, 0);
    assert.equal(x.bindings.b.eventSource.listeners.size, 0);
    for (const type of ['open', 'stop'] as const) {
      await assert.rejects(x.engine.command({ type, id: old.id, token: old.token }), /更新/);
    }
    x.pending.set(new Map([['b', { kind: 'approval', key: 'child-request', sessionId: 'b' }]]));
    await x.engine.command({ type: 'restore' });
    assert.deepEqual(x.state.items.map(item => item.id), ['a']);
    assert.equal(x.state.hidden, 0);
  } finally { x.engine.dispose(); }

  const child = { id: 'child', running: true, origin: 'subagent' };
  const list = new State<SessionList>({ ids: ['child'], byId: { child } });
  const engine = createNotifications({ list, binding() { throw new Error('不应绑定子代理'); }, open() { throw new Error('不应打开子代理'); } }, new State(new Map()), () => {});
  try { assert.equal(engine.getSnapshot().items.length, 0); assert.equal(engine.getSnapshot().activity.pose, 'idle'); }
  finally { engine.dispose(); }
});
