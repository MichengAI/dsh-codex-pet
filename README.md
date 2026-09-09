<p align="center">
  <img src="assets/branding/dsh-codex-pet-banner.png" alt="DSH Codex Pet — a companion for your tasks" width="100%">
</p>

<div align="center">

# DSH Codex Pet

**A little companion for your DeepSeek Harness tasks.**

[简体中文](README.zh-CN.md) · [Screenshots](#screenshots) · [Features](#features) · [Installation](#installation) · [Usage](#usage) · [Development](#development) · [Changelog](CHANGELOG.md)

[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![Node.js 22.19+](https://img.shields.io/badge/Node.js-22.19%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Development preview](https://img.shields.io/badge/Status-Development%20preview-d97706.svg)](#validation-and-current-limits)

</div>

DSH Codex Pet brings a pet library, task notifications, and a Skill-based creation flow to [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). All nine built-in Codex pet sprite sheets ship with the plugin. Users do not need to install Codex.

## Features

- **Nine built-in pets**: choose a companion and adjust its size in pet settings. Assets are bundled locally.
- **Web and desktop**: pets stay inside the page on Web; a compatible DSH Desktop bridge enables a native desktop window.
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

Use [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop) as a desktop workbench, or add plugins to an existing DeepSeek Harness environment. Native pet windows require a Desktop build with the compatible pet bridge.

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

## Prerequisites

- DeepSeek Harness with its Web interface and the `dsh` command available.
- Node.js **22.19 or newer** for building from source.
- A compatible DSH Desktop pet bridge for native desktop display. Older Desktop builds fall back to the Web overlay.
- A configured image-generation tool in DSH to create custom pets.

## Installation

This is a **0.1.0 development preview**, distributed through [GitHub Releases](https://github.com/MichengAI/dsh-codex-pet/releases/tag/v0.1.0). Repository access is required to download the archive or clone the source. No npm package has been published. Replace `web` below with your actual DSH profile.

Download `michengai-dsh-codex-pet-0.1.0.tgz` from the release and run `dsh plugin --profile web add .\michengai-dsh-codex-pet-0.1.0.tgz --ignore-scripts` from its download directory, then reload DSH. The source build instructions follow.

### Ask an agent to install it

```text
Install DSH Codex Pet from my local source checkout into the DSH web profile. In that checkout, run npm ci, npm run check, npm test, and npm pack. If all checks pass, install the generated michengai-dsh-codex-pet-0.1.0.tgz using dsh plugin --profile web add .\michengai-dsh-codex-pet-0.1.0.tgz --ignore-scripts. Run dsh --profile web --dump-config and confirm michengai-codex-pet is present. Explain how to reload DSH and open pet settings. Preserve existing tasks and user data.
```

### Build and install manually

Run from the project root:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

npm ci
npm run check
npm test
npm pack
dsh plugin --profile web add .\michengai-dsh-codex-pet-0.1.0.tgz --ignore-scripts
dsh --profile web --dump-config
```

Stop if any command fails. `npm pack` builds the plugin and checks that the nine sprite sheets and creation Skill are present. The generated archive includes the runtime assets.

### Reloading

After active tasks finish, restart the relevant DSH Web service or reload Desktop. A browser refresh alone does not replace an already loaded Host module.

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

### Create a custom pet

1. Open pet settings, click **Create** (`创建`), and describe the companion.
2. Click **Create in DSH** (`在 DSH 中创建`). The plugin opens a dedicated task and sends the bundled Skill instructions.
3. Follow that task's progress. Creation uses DSH's configured model and image tools.
4. Once the pet files are saved, refresh the pet library and select the new companion.

The bundled `skills/hatch-pet/SKILL.md` is adapted for DSH and the compatible sprite-sheet format. The creation flow does not invoke the Codex CLI. A missing image tool must be resolved in DSH; opening the creation task alone does not mean a pet has been generated.

## Data and assets

- Built-in sprite sheets: `assets/codex/`, included with the plugin.
- Custom pets: `${DSH_HOME}\codex-pet\pets`; when `DSH_HOME` is unset, the base directory is the user's `.dsh` directory.
- Existing Codex pets are not automatically read, moved, or migrated.
- Uninstalling the plugin leaves custom pet files and configuration in place.

The plugin is independently implemented and community maintained. The bundled Codex pet artwork comes from Codex; it is not original artwork by this project. This project is not an official OpenAI or DeepSeek product.

## Plugin updates

Pet settings show the running version, GitHub and issue links, and **Check for updates**. The updater queries npm and installs into the current DSH profile using the Desktop installer or DSH CLI. Until the package is published to npm, it reports that updates are not yet available. Unsupported hosts can copy a manual update command. Wait for active tasks to finish before installing an update; reload DSH when prompted.

## Uninstallation

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web remove @michengai/dsh-codex-pet
```

Reload DSH afterward. Keep your DSH data directory when switching versions.

## Development

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

npm ci
npm run check
npm test
npm run build
```

- `src/`: Host service, pet settings, animation, and task notifications.
- `skills/`: the bundled pet creation Skill.
- `test/`: library, creation, and notification regression tests.
- `scripts/`: build, asset maintenance, package verification, and isolated Electron smoke checks.
- `lib/`: generated runtime output; edit `src/` instead.

There is no standalone HTML preview. Verify the plugin inside DSH; `/desktop.html` remains the native pet window entry. `assets:import` is a maintainer command for updating original assets, not an installation requirement.

For CodeGraph, run `codegraph init .` once, `codegraph sync .` after changes, and `codegraph status .` to check freshness. The index and local project documentation under `docs/` are excluded from Git.

## Validation and current limits

Type checking, 21 automated tests, the build, and controlled Electron client interaction checks have passed. These cover task notifications and the creation request flow. Complete image generation, real-model task interaction, and the normal Desktop installation still need end-to-end acceptance testing.
