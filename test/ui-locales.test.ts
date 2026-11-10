import test from 'node:test';
import assert from 'node:assert/strict';
import { translator } from '../src/ui-locales.ts';

test('界面翻译支持语言回退和插值，未知文案及缺失参数保留原文', () => {
  assert.equal(translator('zh-CN')('还有 {count} 个会话', { count: 0 }), '还有 0 个会话');
  assert.equal(translator('en-US')('还有 {count} 个会话', { count: 2 }), '2 more conversations');
  assert.equal(translator('ja')('选择宠物'), 'ペットを選択');
  assert.equal(translator('es')('选择宠物'), 'Elegir una mascota');
  assert.equal(translator('fr')('选择宠物'), 'Choisir un animal');
  assert.equal(translator('de')('选择宠物'), 'Haustier auswählen');
  assert.equal(translator('ru')('选择宠物'), 'Выбрать питомца');
  assert.equal(translator('pt')('选择宠物'), 'Escolher um mascote');
  assert.equal(translator('ko')('选择宠物'), 'Choose a pet');
  assert.equal(translator('en')('还有 {count} 个会话'), '{count} more conversations');
  assert.equal(translator('en')('用户自定义内容'), '用户自定义内容');
  assert.equal(translator('en')('关闭通知：{title}', { title: '{count} $& 用户标题' }), 'Dismiss notification: {count} $& 用户标题');
});
