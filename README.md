<p align="center">
  <img src="assets/branding/dsh-codex-pet-banner.png" alt="DSH Codex Pet" width="100%">
</p>

<div align="center">

# DSH Codex Pet

**A little companion for your DeepSeek Harness tasks**

[简体中文](README.zh-CN.md) · [Changelog](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-codex-pet.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![npm downloads](https://img.shields.io/npm/dt/%40michengai%2Fdsh-codex-pet.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-codex-pet)
[![Node.js 22.19+](https://img.shields.io/badge/Node.js-22.19%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> DSH Codex Pet is a community-maintained pet plugin for DeepSeek Harness (DSH), not an official OpenAI or DeepSeek AI product.

## Features

Keep a companion nearby while you work in DSH, follow task progress, and handle requests that need your attention. Choose a built-in pet or create your own with a Skill.

- **Nine built-in pets**: choose a companion and adjust its size in pet settings. Assets are bundled locally.
- **In-page companion**: keep a companion in DSH Web. Floating desktop pets require a desktop app with pet support.
- **Multiple tasks at a glance**: follow running tasks, completion, errors, and requests that need your attention. An empty notification list leaves only the pet visible.
- **Act from the notification**: open the associated task, stop its current turn, or handle supported approval, question, and plan requests.
- **Quiet when you need it**: dismiss an individual reminder without stopping its task; collapse or restore the pet through its menu or settings.
- **Create your own companion**: describe a pet in settings and start a dedicated DSH task using the bundled `hatch-pet` Skill.
- **Small interactions**: drag to move, double-click to jump, and right-click for the pet menu.

## Screenshots

### Multiple task notifications

See running tasks beside your companion, with separate controls to open the conversation, stop its current turn, or dismiss its reminder.

<p align="center">
  <img src="assets/screenshots/pet-notifications.png" alt="A pet with two running task notifications" width="403">
</p>

### Pet settings

Choose from the nine built-in pets, access the custom pet directory, and adjust the pet size.

![Pet library and appearance settings](assets/screenshots/pet-settings.png)

### A companion in your conversation

Keep working in DSH while the pet and task notifications remain in the corner of the page.

![Pet and task notifications alongside a DSH conversation](assets/screenshots/pet-conversation.png)

## DSH product ecosystem

Add plugins as needed to your existing DeepSeek Harness environment.

| Plugin | What you can do |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organize projects and conversations and navigate tasks |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Send tasks and receive replies through messaging platforms |
| [Automation](https://github.com/MichengAI/dsh-automation) | Schedule tasks and review their runs |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Find, enable, create, and import local skills |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Search, restore, and manage archived conversations |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Choose specialists for a task |
| [BTW](https://github.com/MichengAI/dsh-btw) | Ask side questions in the current context |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Improve code within your Git changes |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Keep a companion nearby and handle task notifications |

## Installation

Supported DeepSeek Harness versions: **`0.1.0-rc.8`, `0.1.1-rc.2`, `0.1.2-rc.1`, `0.1.5-rc.1`, and `0.1.5-rc.2`**. New compatibility is added without dropping these older releases. Make sure the `dsh` command is available. The example uses the `web` profile; replace it with your target profile.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Restart DSH after installation, then open **Settings → Pets**.

## Usage

Open **Settings → Pets** (`宠物` in the current UI), or open settings from the pet's right-click menu.

| Goal | Action |
| --- | --- |
| Pick a companion | Select a pet in settings and adjust its size. |
| Move or play | Drag the pet to move it; double-click to jump. |
| Read task updates | Read the notification bubbles; expand the list when several tasks need attention. |
| Continue a conversation | Click its notification or reply control to open the corresponding DSH task. |
| Handle a request | Open the request details and answer the supported approval, question, or plan prompt. |
| Stop a task turn | Click the stop control on that running task's notification. |
| Dismiss a reminder | Click its close control. The task continues running. |
| Hide or restore the pet | Use the right-click menu or pet settings. |

The pet is a notification and action surface. Start new conversations and write follow-up messages in the main DSH interface.

Known issue: in DSH `0.1.5-rc.2`, stopping a task before the model starts responding may cause the pet to show a failure notification.

### Create a custom pet

1. Open pet settings, click **Create** (`创建`), and describe the companion.
2. Click **Create in DSH** (`在 DSH 中创建`). The plugin opens a dedicated task and sends the bundled Skill instructions.
3. Follow that task's progress. Creation uses DSH's configured model and image tools.
4. Once the pet files are saved, refresh the pet library and select the new companion.

Creating pets requires an image-generation tool configured in DSH.

## Updates and uninstallation

Use **Settings → Pets → Check for updates**. If automatic installation is unavailable, copy the update command shown in the dialog. Wait for running tasks to finish, then update and restart DSH as prompted.

To uninstall:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web remove @michengai/dsh-codex-pet
```

Custom pets are stored in `.dsh/codex-pet/pets` under your user directory by default; open the folder from pet settings. If `DSH_HOME` is set, pets are stored in its `codex-pet/pets` folder. Uninstalling keeps those files and settings.

## Contributing

See the [development and validation guide (Chinese)](https://github.com/MichengAI/dsh-codex-pet/blob/main/CONTRIBUTING.md) for local development, testing, and release procedures.

## License

Original plugin code is licensed under [Apache License 2.0](LICENSE). Bundled pet artwork originates from OpenAI Codex and is excluded from this project's Apache-2.0 license grant; see [NOTICE](NOTICE).
