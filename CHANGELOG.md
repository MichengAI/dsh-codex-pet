# Changelog

## [Unreleased]

- Return stable update error codes and localize failures in the dialog; cover translator interpolation and fallback, and document host compatibility and command-scoped release-age behavior.
- Localize built-in pet names and descriptions, settings navigation, creation controls, notifications, and floating pet menus using the DSH locale. Preserve custom pet and conversation content.
- Add the installed version, GitHub and issue links, and the shared npm update dialog; fix opening the custom pet folder on Windows.
- Cancel Desktop updates after ten minutes and retain the installation lock until the process settles. Distinguish an unpublished npm package (409) from registry failure (503).
- Share pet-library polling across page entries and avoid publishing unchanged notifications to the Desktop bridge. Remove the obsolete client creation API.
- Pass type checking, 25 automated tests, the build, and controlled Electron checks for language switching, update dialogs, and native pet rendering. Real npm installation and normal Desktop installation still require end-to-end acceptance.

## [0.1.0] - 2026-09-09

- Bundle nine pets, pet settings, and a DSH Skill-based entry for creating custom companions.
- Support in-page Web companions and native windows through a compatible Desktop pet bridge.
- Add multiple-task notifications, task navigation, current-turn cancellation, and approval, question, and plan request handling.
- Exclude subagent sessions to prevent subagent routing errors when opening or stopping tasks.
- Simplify the creation prompt by removing the Codex dependency disclaimer.
- Provide English and Chinese READMEs, a banner, and real plugin screenshots; keep local docs outside version control.
- Pass type checking, 17 automated tests, and the build; complete image generation, real-model interaction, and the normal Desktop installation still need end-to-end acceptance testing.
