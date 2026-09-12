# 开发与验证指南

本文面向插件维护者，说明本地验证、端到端测试和发布检查。安装与使用请参阅 [中文 README](README.zh-CN.md) 或 [English README](README.md)。

## 本地验证

开发依赖和锁文件固定 DSH `0.1.5-rc.2`。使用 `npm ci` 复现，`npm run check` 同时检查插件与官方服务类型的兼容性。

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
npm ci
npx playwright install chromium
npm run check
npm test
npm run smoke
npm run test:e2e
```

## 端到端测试

Pet 的 Web 浮层通过 React Portal 挂载到 `body > [data-dsh-pet-overlay]`，空白区域点击穿透。配合 Codex UI 设置页显示时，需要同时使用已对该容器放行隔离和焦点限制的 Codex UI；仅更新 Pet 无法绕过旧版设置页的背景隔离。

同级目录存在 `dsh-codex-ui` 源码时，在 Pet 仓库运行 `node scripts\verify-global-overlay.mjs`，可验证实际 Portal 和设置页隔离逻辑的显示、点击、焦点循环、空白穿透、重复切换和卸载清理。该浏览器夹具不替代完整 DSH Profile 验收。

端到端测试另需 PATH 中有 pnpm（CI 使用 `11.25.0`）。它通过官方 CLI 安装本地发行包、启动完整 DSH Web，验证宠物设置、持久化、创建会话、提问回传、完成与失败通知和停止任务。只有外部模型 HTTP 服务使用本地夹具，不调用付费模型或生成图片。测试使用独立 `DSH_HOME`，日志和截图保存在忽略的 `.preview/e2e-latest-*` 下，不改动日常 Profile。

## CI 与发布要求

官方类型检查验证结构兼容性，不替代服务生命周期验证。E2E 拆为独立 CI job，限时 25 分钟；发布前必须验证标签提交对应的 main push CI 成功，且全部 5 个宿主版本的中英文 job 均通过；先等待 CI，再打标签，缺失、运行中、跳过或失败的检查都会阻止发布。

## Windows 重试与证据保留

Windows Profile 链接错误（`EBUSY`）在共享的 120 秒启动预算内每次等待 5 秒后重试，关闭进程最多另需 10 秒；这只缓解瞬时竞争，不代表 Windows 已稳定，其他错误直接失败。报告同时保留语言、原始失败、重试记录及独立清理错误。通过 PowerShell（Windows 使用 `powershell.exe`，其他平台使用 `pwsh`）保留最近 5 次已标记并结束的运行；未标记的历史证据、未结束运行及含 `.keep` 文件的目录不回收，清理不跟随目录链接。发布验收证据应在后续运行前添加 `.keep`。

## 测试环境配置

可设置 `DSH_PET_E2E_LOCALE` 为 `zh-CN`（默认）或 `en-US` 选择浏览器语言，CI 对全部 5 个版本分别验证两种语言。设置 `DSH_PET_E2E_VERSION` 可选择旧版宿主，其完整官方依赖图在隔离目录内精确安装，开发依赖继续保持 rc.2。可通过 `DSH_PET_E2E_ROOT` 指向另一个名为 `.preview` 的独立目录，将测试宿主和证据放到其他磁盘。
