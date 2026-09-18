/** 在 DSH 自己的会话服务中启动随包 Skill，不调用外部 Codex。 */
export interface CreationSessions {
  create(options?: { cwd?: string }): Promise<string>;
  open?(id: string): unknown;
  using?(
    id: string,
    options: { source: string },
    operation: (reference: {
      ready: Promise<unknown>;
      binding: { session: { prompt(content: { type: 'text'; text: string }[], mode: 'queue'): Promise<{ ok: boolean; error?: { message?: string } }> } };
    }) => unknown,
  ): Promise<unknown>;
  binding(id: string): { session: { prompt(content: { type: 'text'; text: string }[], mode: 'queue'): Promise<{ ok: boolean; error?: { message?: string } }> } } | undefined;
}

function tryOpen(sessions: CreationSessions, id: string): void {
  try { sessions.open?.(id); } catch { /* 创建仍可先 retain 再发 prompt */ }
}

export async function createPetSession(sessions: CreationSessions, description: string, directory: string, skill: string): Promise<void> {
  if (!description.trim() || description.length > 2000) throw new Error('请输入 1–2000 字的宠物描述');
  const id = await sessions.create({ cwd: directory });
  const text = `请先读取并遵循宠物创建 Skill：${skill}\n宠物要求：${description.trim()}\n成品保存到 ${directory} 下的新目录，保留所有已有宠物。使用 DSH 当前配置的图像工具。缺少生图工具时明确说明，不生成占位图，不虚报完成。`;
  const send = async (session: NonNullable<ReturnType<CreationSessions['binding']>>['session']) => {
    const result = await session.prompt([{ type: 'text', text }], 'queue');
    if (!result.ok) throw new Error(result.error?.message ?? 'DSH 未接受宠物创建请求');
  };
  tryOpen(sessions, id);
  const binding = sessions.binding(id);
  if (binding?.session.prompt) {
    await send(binding.session);
    tryOpen(sessions, id);
    return;
  }
  if (sessions.using) {
    await sessions.using(id, { source: 'controllerOperation' }, async reference => {
      await reference.ready;
      await send(reference.binding.session);
    });
    tryOpen(sessions, id);
    return;
  }
  throw new Error('创建会话尚不可用，请重试');
}
