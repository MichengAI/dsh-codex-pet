/** 编译时用官方服务类型检查插件边界，避免本地接口替身掩盖宿主升级变化。 */
import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-host-webserver';
import type {} from '@deepseek-ai/dsh-api-session-controller/client';
import type {} from '@deepseek-ai/dsh-client-ui-session/client';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type {} from '@deepseek-ai/dsh-client-locale/client';
import type { apply as applyHost } from '../src/index.ts';
import type { apply as applyClient } from '../src/client.tsx';
import type { CreationSessions } from '../src/creation.ts';

export function checkDshContracts(ctx: Context): void {
  const host: Parameters<typeof applyHost>[0] = ctx;
  const client: Parameters<typeof applyClient>[0] = ctx;
  const creation: CreationSessions = ctx.sessions;
  void [host, client, creation];
}
