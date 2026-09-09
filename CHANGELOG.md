# Changelog

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
