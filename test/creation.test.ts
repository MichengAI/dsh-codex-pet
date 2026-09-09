import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PetLibrary } from '../src/library.ts';
import { createPetSession } from '../src/creation.ts';
test('没有 Codex 目录仍加载九只宠物与随包 Skill，数据仅位于 DSH', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-pets-'));
  try {
    const library = new PetLibrary(resolve('assets/codex'), root);
    await library.init();
    assert.equal(library.pets.length, 9);
    assert.equal(library.customPath, join(root, 'pets'));
    assert.equal(library.snapshot().skillAvailable, true);
    assert.ok(!library.skillPath.includes('.codex'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('创建请求使用 DSH 会话和独立目录，拒绝时不报成功', async () => {
  let opened = '', prompt = '', accepted = true;
  const sessions = { async create(options?: {cwd?: string}) { assert.equal(options?.cwd, 'dsh/pets'); return 'pet-task'; }, open(id: string) { opened=id; }, binding() { return {session:{ async prompt(parts: {text:string}[]) { prompt=parts[0].text; return {ok:accepted,error:{message:'模型未配置'}}; }}}; }};
  await createPetSession(sessions, '海獭', 'dsh/pets', 'plugin/skills/hatch-pet/SKILL.md');
  assert.equal(opened, 'pet-task'); assert.match(prompt, /海獭/); assert.match(prompt, /plugin\/skills/);
  accepted=false; await assert.rejects(createPetSession(sessions, '猫', 'dsh/pets', 'skill'), /模型未配置/);
});
