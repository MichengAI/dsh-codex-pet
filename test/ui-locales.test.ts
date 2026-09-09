import test from 'node:test';
import assert from 'node:assert/strict';
import { translator } from '../src/ui-locales.ts';
import { updateErrorMessage } from '../src/update-errors.ts';

test('界面翻译支持语言回退和插值，未知文案及缺失参数保留原文', () => {
  assert.equal(translator('zh-CN')('还有 {count} 个会话', { count: 0 }), '还有 0 个会话');
  assert.equal(translator('en-US')('还有 {count} 个会话', { count: 2 }), '2 more conversations');
  assert.equal(translator('fr')('选择宠物'), 'Choose a pet');
  assert.equal(translator('en')('还有 {count} 个会话'), '{count} more conversations');
  assert.equal(translator('en')('用户自定义内容'), '用户自定义内容');
  assert.equal(translator('en')('关闭通知：{title}', { title: '{count} $& 用户标题' }), 'Dismiss notification: {count} $& 用户标题');
});

test('更新错误按稳定代码翻译，未知代码安全回退', () => {
  assert.match(updateErrorMessage('UPDATE_TIMEOUT', 'en'), /timed out/);
  assert.match(updateErrorMessage('UPDATE_TIMEOUT', 'zh-CN'), /已请求取消/);
  assert.equal(updateErrorMessage('NOT_PUBLISHED', 'en'), 'The plugin has not been published to npm yet.');
  for (const code of [undefined, null, 'toString', '__proto__', 'FUTURE_CODE']) {
    assert.equal(updateErrorMessage(code, 'en'), 'The update failed. Check the server logs.');
  }
});
