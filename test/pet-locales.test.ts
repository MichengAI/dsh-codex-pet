import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTINS, type Pet } from '../src/model.ts';
import { localizePet } from '../src/pet-locales.ts';

test('九只内置宠物支持全 8 门官方语言，切换语言不改变标识和图集', () => {
  const supported = ['zh-CN', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt'];
  for (const [id, name, description] of BUILTINS) {
    const pet: Pet = { id, name, description, source: 'builtin', version: 2, url: '/asset/' + id };
    for (const lang of supported) {
      const translated = localizePet(pet, lang);
      assert.equal(translated.id, pet.id);
      assert.equal(translated.url, pet.url);
      assert.ok(translated.name.length > 0);
      assert.ok(translated.description.length > 0);
    }
    const zhPet = localizePet(pet, 'zh-CN');
    assert.match(zhPet.description, /[\u4e00-\u9fff]/);
    assert.deepEqual(localizePet(zhPet, 'en'), pet);
    // 未知语言回退到 en
    assert.deepEqual(localizePet(pet, 'it'), pet);
  }
});
test('自定义宠物及未知内置宠物保留原始内容', () => {
  const pet: Pet = { id: 'custom:bsod', name: 'My 宠物', description: '用户原文', source: 'custom', version: 2, url: '/custom' };
  assert.equal(localizePet(pet, 'zh'), pet); assert.equal(localizePet(pet, 'en'), pet);
  const unknown = { ...pet, id: 'future', source: 'builtin' as const };
  assert.equal(localizePet(unknown, 'zh'), unknown);
});
