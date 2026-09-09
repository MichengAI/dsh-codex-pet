import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTINS, type Pet } from '../src/model.ts';
import { localizePet } from '../src/pet-locales.ts';

test('九只内置宠物支持中文与英文，切换语言不改变标识和图集', () => {
  for (const [id, name, description] of BUILTINS) {
    const pet: Pet = { id, name, description, source: 'builtin', version: 2, url: '/asset/' + id };
    const translated = localizePet(pet, 'zh-CN');
    assert.match(translated.description, /[\u4e00-\u9fff]/);
    assert.equal(translated.id, pet.id); assert.equal(translated.url, pet.url);
    assert.deepEqual(localizePet(translated, 'en'), pet);
    assert.deepEqual(localizePet(pet, 'fr'), pet);
  }
});
test('自定义宠物及未知内置宠物保留原始内容', () => {
  const pet: Pet = { id: 'custom:bsod', name: 'My 宠物', description: '用户原文', source: 'custom', version: 2, url: '/custom' };
  assert.equal(localizePet(pet, 'zh'), pet); assert.equal(localizePet(pet, 'en'), pet);
  const unknown = { ...pet, id: 'future', source: 'builtin' as const };
  assert.equal(localizePet(unknown, 'zh'), unknown);
});
