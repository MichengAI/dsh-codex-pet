/** 更新接口的稳定错误码与显示文案；底层安装诊断只写入 Host 日志。 */
const messages = {
  "INVALID_VERSION": [
    "无法读取当前插件版本。",
    "Could not read the current plugin version."
  ],
  "AUTO_UPDATE_UNAVAILABLE": [
    "当前环境不支持自动更新，请使用手工更新命令。",
    "Automatic updates are unavailable. Use the manual update command."
  ],
  "UPDATE_TIMEOUT": [
    "更新超时，已请求取消；进程结束前不能再次安装。",
    "The update timed out and cancellation was requested. Wait for the process to exit before retrying."
  ],
  "UNTRUSTED_REQUEST": [
    "已拒绝非本机同源更新请求。",
    "The update request was rejected because it is not from the same local origin."
  ],
  "UPDATE_IN_PROGRESS": [
    "当前插件正在更新，请稍候。",
    "The plugin is being updated. Please wait."
  ],
  "NOT_PUBLISHED": [
    "插件尚未发布到 npm。",
    "The plugin has not been published to npm yet."
  ],
  "REGISTRY_UNAVAILABLE": [
    "暂时无法获取最新版本。",
    "Could not retrieve the latest version. Please try again later."
  ],
  "UPDATE_FAILED": [
    "更新失败，请查看服务端日志。",
    "The update failed. Check the server logs."
  ]
} as const;
export type UpdateErrorCode = keyof typeof messages;
export function updateErrorMessage(code: unknown, language: string): string {
  const key = typeof code === 'string' && Object.hasOwn(messages, code) ? code as UpdateErrorCode : 'UPDATE_FAILED';
  return messages[key][/^zh(?:-|$)/i.test(language) ? 0 : 1];
}
export class UpdateFailure extends Error {
  constructor(readonly code: UpdateErrorCode, detail?: string) {
    super(detail ?? updateErrorMessage(code, 'zh'));
  }
}
export function updateErrorPayload(code: UpdateErrorCode) {
  return { code, error: updateErrorMessage(code, 'zh') };
}
