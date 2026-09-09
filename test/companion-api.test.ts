import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompanionProvider, type CompanionSnapshot } from '../src/companion-api.ts';
import { DEFAULT_CONFIG, IDLE } from '../src/model.ts';

test('消费者接口隔离快照、去重通知，多个展示接管独立释放，卸载后拒绝操作', async () => {
  const commands: unknown[] = [], display: boolean[] = [];
  const provider = createCompanionProvider({ command: async value => { commands.push(value); }, updateConfig: async () => {}, openSettings() {}, externalDisplay: value => display.push(value) });
  const snapshot: CompanionSnapshot = { pet: null, config: { ...DEFAULT_CONFIG }, language: 'en', notifications: { items: [], hidden: 0, activity: IDLE } };
  let changes = 0;
  const off = provider.api.subscribe(value => { changes++; if (value) value.config.size = 999; });
  provider.publish(snapshot); provider.publish(snapshot);
  assert.equal(changes, 1);
  assert.equal(provider.api.getSnapshot()?.config.size, DEFAULT_CONFIG.size);
  const first = provider.api.acquireDisplay(), second = provider.api.acquireDisplay();
  first(); first(); assert.equal(display.at(-1), true);
  second(); assert.equal(display.at(-1), false);
  await provider.api.command({ type: 'restore' }); assert.deepEqual(commands, [{ type: 'restore' }]);
  provider.dispose(); assert.equal(provider.api.getSnapshot(), null); assert.equal(changes, 2);
  await assert.rejects(provider.api.command({ type: 'restore' }), /已卸载/);
  off();
});
