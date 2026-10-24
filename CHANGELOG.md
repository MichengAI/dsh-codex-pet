# Changelog

## [1.0.6] - 2026-10-24

- Upgrade host admission policy: Declare `engines.dsh: ">=0.2.0-rc.1 <0.3.0-0"` to support the entire DeepSeek Harness `0.2.x` line (including `0.2.0-rc.1` onwards, future alphas, RCs, and stable releases) without requiring routine plugin version bumps.
- Decouple peerDependencies locks: Broaden all `@deepseek-ai/dsh-*` peer dependencies to the `0.2.x` generation range.
- Upgrade build-time development dependencies: Synchronize all `@deepseek-ai/dsh-*` devDependencies to latest `0.2.1-rc.3`.

## [1.0.4] - 2026-10-24

- Fix e2e assertions and smoke tests for pseudo-element nav icon.

## [1.0.3] - 2026-10-24

- Add compatibility with DeepSeek Harness `0.2.1-rc.3` while retaining all existing supported versions.

## [1.0.2] - 2026-10-19

- Settings navigation draws the pet icon with a skin-safe CSS mask. It covers both the native DSH settings dialog and the dsh-codex-ui settings page without rewriting the host SVG.
- The pet settings page uses the host Button primitive and host typography, spacing, 0.5px borders, layer tokens, and container queries. The create action is a 22px plus icon next to refresh.
- The settings dialog follows host modal tokens, and the pet description field follows host input metrics.
- The end-to-end suite covers the nav icon, full-width layout, and host control metrics. The isolated smoke test loads the host primitives and checks the mask icon.

## [1.0.1] - 2026-10-17

- Add compatibility with DSH `0.2.1-rc.2` without dropping `0.2.0-rc.1`, `0.2.0-rc.2`, or `0.2.1-rc.1`. Pin development types and the default end-to-end host to `0.2.1-rc.2`. Cordis stays `4.0.5`.
- This host still provides the session APIs the pet uses, so no new host branch was added. Hosts before `0.2.0` and the `0.2.1` alphas are still rejected by the version gate, and the plugin will not run. Pet settings are not deleted.

## [1.0.0] - 2026-10-17

- Supported hosts are now DeepSeek Harness `0.2.0-rc.1`, `0.2.0-rc.2`, and `0.2.1-rc.1`. Development types and the default end-to-end host are pinned to `0.2.1-rc.1`. Cordis is `4.0.5`.
- Hosts before `0.2.0` are rejected by the version gate, and the plugin will not run. That includes the previously supported `0.1.2-rc.1`, `0.1.5-rc.1`, `0.1.5-rc.2`, `0.1.5-rc.3`, `0.1.7-rc.1`, and `0.1.7-rc.2`. If you still use one of those hosts, install `@michengai/dsh-codex-pet@0.1.19` instead of `@latest`.
- `0.2.1-alpha.1` through `0.2.1-alpha.5` are also rejected by the version gate, and the plugin will not run. The intermediate alpha hosts are no longer supported.
- The version gate only refuses to load the plugin. Pet selection, position, and custom pets remain under `DSH_HOME/codex-pet` (default `~/.dsh/codex-pet`) and are not deleted.

## [0.1.19] - 2026-10-14

- Support DSH `0.2.1-alpha.3` while retaining all existing supported versions. Pin development types and the default end-to-end host to this release. Cordis moves to `4.0.5-alpha.2` to match the host.

## [0.1.18] - 2026-10-14

- Adjust settings navigation section order to ensure stable placement and avoid conflicts with other plugins.

## [0.1.17] - 2026-10-12

- Support DSH `0.2.1-alpha.2` while retaining all existing supported versions.

## [0.1.16] - 2026-10-10

- On official macOS Desktop, enabling the plugin no longer blocks window dragging or double-click zoom. The in-page pet and settings pages are unchanged.

## [0.1.15] - 2026-10-07

- Official Desktop can update this plugin in place. It no longer targets the web profile by mistake.
- A new version is marked with a warning color. Version numbers keep their normal color.
- After updating, fully quit and reopen DSH Desktop.

## [0.1.13] - 2026-10-06

- The installed-plugin list shows “Codex Pet” and a localized description instead of the package name. Titles and descriptions come from `meta.title` and `meta.description` in `locale/zh.json` and `locale/en.json`.
- Installing from GitHub now includes the compiled runtime, so no manual build is required.

## [0.1.12] - 2026-09-30

- Add compatibility with DSH `0.2.0-rc.2` without dropping the existing supported hosts. Pin development types and the default end-to-end host to this release. Cordis stays `4.0.4`.
- The services and slots this plugin uses keep their contracts. No host-version branch was added.

## [0.1.11] - 2026-09-28

- Add compatibility with DSH `0.2.0-rc.1` without dropping the existing supported hosts. Pin development types and the default end-to-end host to this release. Cordis stays `4.0.4`.
- The services and slots this plugin uses keep their contracts. No host-version branch was added.

## [0.1.10] - 2026-09-25

- Add compatibility with DSH `0.1.7-rc.2` without dropping the existing supported hosts. Pin development types and the default end-to-end host to this release.
- This release is additive for the plugin: the services it uses keep their contracts, and the two slots it registers are new keys, so no host-version branch or legacy path was needed.
- The isolated end-to-end host now checks the external Cordis HMR package only when the target version's dependency graph still declares it, and locates it through the lock file. DSH `0.1.7` and later ship HMR with the host, so the old assertion failed the isolated installation outright.

## [0.1.9] - 2026-09-24

- Pin development dependencies and the default end-to-end host to DSH `0.1.7-rc.1`, and Cordis to `4.0.4`. Drop `0.1.6-alpha.1`, `0.1.6-alpha.2`, and `0.1.7-alpha.1` from the compatibility list; keep the existing RC hosts.
- Isolated end-to-end hosts now resolve dependencies as of that host's publish time, so a later Cordis release cannot remove the HMR service those hosts require. Pinned `@deepseek-ai/dsh*` packages stay exempt, because some of them are published after the meta package.

## [0.1.8] - 2026-09-22

- Add compatibility with DSH `0.1.7-alpha.1` without dropping the existing supported hosts. Pin development types and the default end-to-end host to this release. The model fixture answers the Messages API on this host.

## [0.1.7] - 2026-09-18

- Add compatibility with DSH `0.1.6-alpha.2` without dropping the existing supported hosts. Keep `sessions.open`, `pendingInteractions`, and legacy session snapshots on older hosts; use `uiWorkspace.openSession` and `uiSession.sessionStatus` only when those APIs are gone. Pin development types and the default e2e host to this release.
- Use a bilingual package description matching the GitHub repository.

## [0.1.6] - 2026-09-16

- Add compatibility with DSH `0.1.6-alpha.1` without dropping the existing supported hosts. Pin development types and the default e2e host to this release.

## [0.1.5] - 2026-09-12

- Keep the pet in a global Web overlay across pages while preserving interaction and letting clicks pass through empty areas.
- Showing the pet on Codex UI settings pages requires Codex UI 1.1.3 or later. The pet still works independently without Codex UI.

## [0.1.4] - 2026-09-11

- Restore compatibility with DSH `0.1.0-rc.8`, `0.1.1-rc.2`, `0.1.2-rc.1`, and `0.1.5-rc.1` while retaining `0.1.5-rc.2`. Adapt legacy session requests so pet notifications can answer questions and approvals on older hosts.

## [0.1.3] - 2026-09-11

- Support DSH Web `0.1.5-rc.2` and correct client service injection so the plugin loads with the updated host. Older DSH versions are outside the supported range.
- Known upstream limitation: stopping before the model returns an HTTP response may produce a `turn/end` serialization error and a failure notification; stopping after streaming starts is supported.

## [0.1.2] - 2026-09-09

- License original plugin code under Apache-2.0 and include LICENSE and third-party artwork NOTICE in the npm package.
- Automate npm publishing through GitHub Actions Trusted Publishing with provenance, version checks, tests, browser smoke checks, and package validation.
- Create bilingual normal GitHub Releases after npm publishing, without tarball or checksum attachments; document npm installation and publisher configuration.

## [0.1.1] - 2026-09-09

- Keep pet rendering inside DSH Web and expose a versioned consumer API for state, notifications, commands, and display handoff. Native window adaptation belongs to the consumer; remove native routes, renderer, bridge calls, and sibling-project tests.
- Use only the verified DSH CLI for npm updates, with a ten-minute timeout and an installation lock retained until process completion. Return stable localized error codes.
- Localize pet names, descriptions, settings, notifications, and menus; preserve user content. Add version and project links, shared update dialog, and Windows folder opening.
- Share library polling and publish only changed notification snapshots.
- Run independent Playwright Chromium smoke tests in temporary directories with automatic cleanup. No Electron or sibling checkout is needed.
- Pass type checking, 25 automated tests, build, and browser smoke checks. Real image generation, real-model interaction, and real npm updates still require acceptance testing.

## [0.1.0] - 2026-09-09

- Bundle nine pets, pet settings, and a DSH Skill-based entry for creating custom companions.
- Support in-page Web companions and native windows through a compatible Desktop pet bridge.
- Add multiple-task notifications, task navigation, current-turn cancellation, and approval, question, and plan request handling.
- Exclude subagent sessions to prevent subagent routing errors when opening or stopping tasks.
- Simplify the creation prompt by removing the Codex dependency disclaimer.
- Provide English and Chinese READMEs, a banner, and real plugin screenshots; keep local docs outside version control.
- Pass type checking, 17 automated tests, and the build; complete image generation, real-model interaction, and the normal Desktop installation still need end-to-end acceptance testing.
