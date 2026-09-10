# Changelog

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
