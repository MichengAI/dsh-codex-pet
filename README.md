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
- **In-page companion**: the plugin displays pets within DSH Web and exposes a consumer API. External hosts own their window and IPC adapters.
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

Install plugins as needed in an existing DeepSeek Harness environment. External consumers may integrate the pet API independently.

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
- A configured image-generation tool in DSH to create custom pets.

## Installation

Compatibility: the host must provide the `locale` client service and support function-valued `settings.section` labels. Local contract checks used `@deepseek-ai/cordis 4.0.2` and `@deepseek-ai/dsh-client-locale 0.1.2-rc.1`, plus the community DSH Codex UI settings implementation. These are checked component versions, not a verified minimum DSH release. Hosts without the locale service are not supported.

Automatic updates use `--config.minimumReleaseAge=0` for that install command so a newly published version can be installed immediately. This bypasses pnpm’s release-age delay for the command without changing the global configuration. The package name, npm registry, and resolved version remain fixed by the server.

Version 0.1.1 includes the settings, localization, npm updater, and consumer API changes described here; see the [changelog](CHANGELOG.md).

The current version is **0.1.1**, available on [npm](https://www.npmjs.com/package/@michengai/dsh-codex-pet). See [GitHub Releases](https://github.com/MichengAI/dsh-codex-pet/releases) for release notes. Replace `web` below with your actual DSH profile.

Run `dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts`, then reload DSH. The source build instructions follow.

### Ask an agent to install it

```text
Install DSH Codex Pet from my local source checkout into the DSH web profile. In that checkout, run npm ci, npm run check, npm test, and npm pack. If all checks pass, install the generated michengai-dsh-codex-pet-0.1.1.tgz using dsh plugin --profile web add .\michengai-dsh-codex-pet-0.1.1.tgz --ignore-scripts. Run dsh --profile web --dump-config and confirm michengai-codex-pet is present. Explain how to reload DSH and open pet settings. Preserve existing tasks and user data.
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
dsh plugin --profile web add .\michengai-dsh-codex-pet-0.1.1.tgz --ignore-scripts
dsh --profile web --dump-config
```

Stop if any command fails. `npm pack` builds the plugin and checks that the nine sprite sheets and creation Skill are present. The generated archive includes the runtime assets.

### Reloading

After active tasks finish, restart the relevant DSH Web service and refresh its Web interface. A browser refresh alone does not replace an already loaded Host module.

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

Pet settings show the running version, GitHub and issue links, and **Check for updates**. The updater queries npm and installs into the current DSH profile using the verified DSH CLI. Unsupported hosts can copy a manual update command. Wait for active tasks to finish before installing an update; reload DSH when prompted.

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

There is no standalone HTML preview or native window entry. Verify the plugin inside DSH. `assets:import` is a maintainer command for updating original assets, not an installation requirement.

For CodeGraph, run `codegraph init .` once, `codegraph sync .` after changes, and `codegraph status .` to check freshness. The index and local project documentation under `docs/` are excluded from Git.

## Validation and current limits

Type checking, 25 automated tests, the build, and controlled browser client interaction checks have passed. These cover task notifications and the creation request flow. Complete image generation, real-model task interaction and real npm updates still need end-to-end acceptance testing.

## Browser smoke test

After `npm ci`, run `npx playwright install chromium`, then `npm run smoke`. Playwright is a development dependency of this project. The test uses headless Chromium and a unique system temporary directory, cleaned after the test process exits. No Electron, sibling repository, `.preview`, or docs output is required.

## Consumer API v1

The plugin publishes `window.dshPet` in the DSH page and emits `dsh-pet-ready` / `dsh-pet-disposed`. Consumers subscribe and render independently; the plugin never imports or probes a consumer. Previous native window routes and window bridges have been removed. Existing native adapters must migrate to this contract.

| Method | Contract |
| --- | --- |
| `getSnapshot()` | Returns a copied `{pet, config, language, notifications}` or `null` before loading/after disposal. Resolve relative pet asset URLs against the DSH page origin. |
| `subscribe(listener)` | Receives changed snapshots or `null` on disposal; returns an unsubscribe function. Read the initial snapshot separately. |
| `command(value)` | Executes notification commands (`open`, `stop`, `dismiss`, `restore`, `approve`, `reject`, `answer`, `sort`). Targeted commands require the current notification `id` and `token`; request answers also require `requestKey`. Validation and rejection stay in the plugin. |
| `updateConfig(value)` | Updates pet settings through the existing validated Host API. |
| `openSettings()` | Opens plugin settings in DSH. |
| `acquireDisplay()` | Hides only the page overlay and returns an idempotent release function. Call release when disconnecting; the overlay returns after all consumers release. This does not change persisted visibility. |

Consumers own their renderer, native window, IPC validation, and disconnect cleanup. The interface carries no native window implementation. User titles, questions, and answer options remain unchanged; the `language` field identifies the display locale.
