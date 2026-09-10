<p align="center">
  <img src="assets/branding/dsh-codex-pet-banner.png" alt="DSH Codex Pet" width="100%">
</p>

<div align="center">

# DSH Codex Pet

**让宠物陪你处理 DeepSeek Harness 任务**

[English](README.md) · [更新日志](CHANGELOG.zh-CN.md) · [Apache-2.0](LICENSE)

[![许可证：Apache-2.0](https://img.shields.io/badge/许可证-Apache--2.0-blue.svg)](LICENSE)
[![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-codex-pet.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![npm 下载量](https://img.shields.io/npm/dt/%40michengai%2Fdsh-codex-pet.svg?label=npm%20%E4%B8%8B%E8%BD%BD%E9%87%8F)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-codex-pet)
[![Node.js 22.19+](https://img.shields.io/badge/Node.js-22.19%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> DSH Codex Pet 是社区维护的 DeepSeek Harness（DSH）宠物插件，并非 OpenAI 或 DeepSeek AI 官方产品。

## 功能概览

让宠物陪你处理 DSH 任务，随时查看会话进展和待处理请求。你可以选择内置宠物，也可以通过 Skill 创建自己的伙伴。

- **9 只内置宠物**：在宠物设置中选择伙伴、调整大小，资源随插件本地打包。
- **页内陪伴**：在 DSH 网页中陪伴工作；桌面浮窗需要使用支持宠物功能的桌面端。
- **多会话动态**：查看运行中、完成、错误和待处理请求；没有通知时只显示宠物。
- **就近处理任务**：从通知打开对应会话、停止当前轮次，或处理支持的审批、问题和计划请求。
- **按需安静**：关闭单条提醒不会停止任务；通过菜单或设置收起、恢复宠物。
- **创建自己的伙伴**：在设置中描述宠物，通过随包 `hatch-pet` Skill 发起独立 DSH 创建任务。
- **轻量互动**：拖动移动、双击跳跃、右键打开宠物菜单。

## 界面预览

### 多会话提醒

宠物旁集中展示运行中的任务，可分别打开会话、停止当前轮次或关闭提醒。

<p align="center">
  <img src="assets/screenshots/pet-notifications.png" alt="宠物与两条运行中的任务通知" width="403">
</p>

### 宠物设置

选择 9 只内置宠物、打开自定义宠物目录，并调整宠物大小。

![宠物库与外观设置](assets/screenshots/pet-settings.png)

### 会话内陪伴

在 DSH 中继续工作，宠物和任务通知显示在页面角落。

![DSH 会话中的宠物与任务通知](assets/screenshots/pet-conversation.png)

## DSH 产品生态

为已有 DeepSeek Harness 环境按需添加功能。

| 插件 | 你可以用它做什么 |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | 整理项目与会话，导航任务 |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | 从消息平台下任务、收回复 |
| [Automation](https://github.com/MichengAI/dsh-automation) | 按计划执行任务，查看运行结果 |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | 查找、启停、创建和导入本机技能 |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | 搜索、恢复和管理已归档会话 |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | 为任务选择专业角色 |
| [BTW](https://github.com/MichengAI/dsh-btw) | 在当前上下文中临时旁问 |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | 整理 Git 改动范围内的代码 |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | 宠物陪伴，查看和处理任务通知 |

## 安装

支持 DeepSeek Harness **`0.1.5-rc.2`**，需要可使用 `dsh` 命令。旧版不在当前支持范围内。以下示例使用 `web` profile，请按实际环境替换。

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

安装后重启 DSH，再打开 **设置 → 宠物**。

## 使用

打开 **设置 → 宠物**，也可从宠物右键菜单打开设置。

| 目标 | 操作 |
| --- | --- |
| 选择伙伴 | 在设置中选择宠物并调整大小。 |
| 移动与互动 | 拖动宠物移动，双击跳跃。 |
| 查看任务动态 | 阅读通知气泡；多个任务需要关注时展开列表。 |
| 继续会话 | 点击通知或回复按钮，打开对应的 DSH 任务。 |
| 处理请求 | 展开请求详情，处理支持的审批、问题或计划。 |
| 停止任务轮次 | 点击对应运行中通知的停止按钮。 |
| 关闭提醒 | 点击通知关闭按钮，任务仍继续运行。 |
| 收起或恢复宠物 | 使用右键菜单或宠物设置。 |

宠物承担通知和待处理操作。新建会话、输入后续消息仍在 DSH 主界面完成。

已知上游边界：DSH `0.1.5-rc.2` 在模型尚未返回 HTTP 响应时停止任务，可能因 `turn/end` 数据不可 JSON 序列化而上报错误，宠物会显示失败通知。已开始流式响应时的停止操作已通过端到端验证。

### 创建自定义宠物

1. 打开宠物设置，点击 **创建**，描述想要的伙伴。
2. 点击 **在 DSH 中创建**，插件会打开独立任务并发送随包 Skill 指令。
3. 在该任务中查看进展，创建使用 DSH 当前配置的模型和图像工具。
4. 宠物文件生成并保存后，刷新宠物库并选择新伙伴。

创建宠物需要先在 DSH 中配置图像生成工具。

## 更新与卸载

在 **设置 → 宠物 → 检查更新** 中更新。若当前环境不支持在线安装，可复制界面提供的更新命令。等待正在运行的任务结束后操作，完成后按提示重启 DSH。

卸载命令：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web remove @michengai/dsh-codex-pet
```

自定义宠物默认保存在用户目录的 `.dsh/codex-pet/pets` 下，可从宠物设置打开。设置了 `DSH_HOME` 时使用该目录下的 `codex-pet/pets`。卸载插件会保留这些文件与配置。

## 开发验证

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

端到端测试另需 PATH 中有 pnpm（CI 使用 `11.25.0`）。它通过官方 CLI 安装本地发行包、启动完整 DSH Web，验证宠物设置、持久化、创建会话、提问回传、完成与失败通知和停止任务。只有外部模型 HTTP 服务使用本地夹具，不调用付费模型或生成图片。测试使用独立 `DSH_HOME`，日志和截图保存在忽略的 `.preview/e2e-latest-*` 下，不改动日常 Profile。

官方类型检查验证结构兼容性，不替代服务生命周期验证。E2E 拆为独立 CI job，限时 25 分钟；发布前必须验证标签提交对应的 main push CI 成功，且中英文 job 均通过；先等待 CI，再打标签，缺失、运行中、跳过或失败的检查都会阻止发布。Windows Profile 链接错误（`EBUSY`）在共享的 120 秒启动预算内每次等待 5 秒后重试，关闭进程最多另需 10 秒；这只缓解瞬时竞争，不代表 Windows 已稳定，其他错误直接失败。报告同时保留语言、原始失败、重试记录及独立清理错误。通过 PowerShell（Windows 使用 `powershell.exe`，其他平台使用 `pwsh`）保留最近 5 次已标记并结束的运行；未标记的历史证据、未结束运行及含 `.keep` 文件的目录不回收，清理不跟随目录链接。发布验收证据应在后续运行前添加 `.keep`。

可设置 `DSH_PET_E2E_LOCALE` 为 `zh-CN`（默认）或 `en-US` 选择浏览器语言，CI 分别验证两种语言。

## 许可证

原创插件代码采用 [Apache License 2.0](LICENSE)。随包宠物图集来源于 OpenAI Codex，不属于本项目授予的 Apache-2.0 许可范围，详见 [NOTICE](NOTICE)。
