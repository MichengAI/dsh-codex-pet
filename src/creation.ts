/** 在 DSH 自己的会话服务中启动随包 Skill，不调用外部 Codex。 */
export interface CreationSessions {
  create(options?: { cwd?: string }): Promise<string>;
  open(id: string): unknown;
  binding(id: string): { session: { prompt(content: { type: 'text'; text: string }[], mode: 'queue'): Promise<{ ok: boolean; error?: { message?: string } }> } } | undefined;
}
export async function createPetSession(sessions: CreationSessions, description: string, directory: string, skill: string): Promise<void> {
  if (!description.trim() || description.length > 2000) throw new Error('请输入 1–2000 字的宠物描述');
  const id = await sessions.create({ cwd: directory });
  sessions.open(id);
  const binding = sessions.binding(id);
  if (!binding) throw new Error('创建会话尚不可用，请重试');
  const text = `请先读取并遵循宠物创建 Skill：${skill}\n宠物要求：${description.trim()}\n成品保存到 ${directory} 下的新目录，保留所有已有宠物。使用 DSH 当前配置的图像工具，不依赖 Codex。缺少生图工具时明确说明，不生成占位图，不虚报完成。`;
  const result = await binding.session.prompt([{ type: 'text', text }], 'queue');
  if (!result.ok) throw new Error(result.error?.message ?? 'DSH 未接受宠物创建请求');
}
