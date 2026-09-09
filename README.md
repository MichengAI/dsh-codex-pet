# DSH Codex Pet

独立运行的 DSH 宠物插件。使用人员无需安装 Codex。交付状态见 [阅读导航](docs/00-交接入口/00-阅读导航.md)。

## 资源与目录

全部 9 只 Codex 原版宠物资源随插件打包；运行时不提取 Codex 安装文件。自定义宠物保存到 `${DSH_HOME}\codex-pet\pets`，DSH_HOME 未设置时使用用户目录下 `.dsh`。原有 Codex 宠物文件不移动、不删除，也不自动读取。

创建 Skill 随插件提供。在 DSH 主界面宠物设置中填写描述，点击“在 DSH 中创建”，会在独立 DSH 会话中发送创建请求。使用当前 DSH 配置的模型和图像工具；缺少生图工具时任务应报告缺失，不能伪造完成。此 Skill 按兼容图集协议编写，适配 DSH；不宣称是未经修改的 Codex 官方 Skill。完成后刷新宠物库。

## 安装与运行

安装生成的 `michengai-dsh-codex-pet-0.1.0.tgz` 到 DSH Web profile，重启对应 DSH 服务。开发目录可使用 link 安装；本机正常 profile 已链接本工作区。Host 代码更新需要空闲时重启 Desktop；仅刷新浏览器不能替换已加载的 Host 模块。

开发需要 Node.js 22.19+。本地预览页已移除，请在 DSH 插件设置中验证；原生宠物窗口入口仍保留。内置资源已随源码保留，使用者无需执行 assets:import；该命令仅供维护者更新原始资源。

Web 只在网页内显示。桌面浮窗需要带宠物桥接的 DSH Desktop；旧安装版回退到网页浮层。

## 验证与边界

npm run check、npm test、npm run build；npm pack 自动检查九只图集和 Skill。受控 DSH 会话创建请求、拒绝处理与独立目录已测试，真实图像生成尚未端到端验收。

多会话通知支持展开收起、数量、排序、逐条关闭恢复、轮次保留、任务跳转、直接审批和问题/计划回答、停止当前轮次。网页和新版原生桥接受控验收通过；旧 Desktop 使用网页回退。真实模型与正式 Desktop 安装验收范围见文档。

卸载插件不会删除 DSH 自定义宠物和配置。恢复旧版本前保留 DSH 数据目录；旧版本可能仍读取 Codex 目录。

当前交互已按用户反馈精简：移除新会话下拉和消息输入区。新建与继续聊天使用 DSH 主界面，宠物专注通知与待处理事项。

## CodeGraph

本项目已初始化本地 CodeGraph 索引，数据库不提交。新克隆运行 `codegraph init .`，日常修改后运行 `codegraph sync .`；使用 `codegraph status .` 检查新鲜度，以源码与测试为准。
