# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## 1.0.1 — 2026-07-15

Compliance release addressing Obsidian community review feedback. No feature changes.

### Changed
- Raised `minAppVersion` to 1.7.2 to match the `revealLeaf` API in use (fixes `no-unsupported-api`)
- Settings tab uses `Setting.setHeading()` instead of raw HTML headings; removed the redundant plugin-name heading
- All fire-and-forget promises are now explicitly `void`-marked or awaited; async DOM event handlers wrapped in sync handlers
- `window.setTimeout` for popout-window compatibility
- Vault adapter is typed with Obsidian's `App` (removed `any` and unsafe access warnings)
- Build config imports `builtinModules` from `node:module` instead of the `builtin-modules` package
- Release assets are built and attested (build provenance) in GitHub Actions CI

## 1.0.0 — 2026-07-15

Initial public release.

### Features
- Grid punch-in modal with auto-close-and-append logic (two clicks per punch)
- Custom activity modal (free-text name + category)
- Timeline back-fill view (24h vertical): click empty slot to add with smart-fill range, click block to edit/delete, drag edges to resize on desktop (snaps to 5 minutes)
- Summary view (sidebar / fullscreen) with today / week / month tabs, per-period navigation (prev/next day, week, month), and copy-as-Markdown
- 1-step undo on the latest punch
- Status bar (desktop) + ribbon tooltip (Android) showing the in-progress activity
- Auto-create today's record file on plugin load
- Editable settings tab: add / remove / rename categories, edit per-category keywords and the records folder, with a restore-defaults option
- Robust `data.json` guard: recovers from a corrupted or missing settings file by falling back to defaults, backing up the broken file, and showing a plain-language notice; never overwrites settings written by a newer version (prevents cross-device downgrade)
- In-progress segments marked with `ing` (legacy `00:00` still read for compatibility)
- Cross-platform (Desktop + Android) from a single codebase; all data stored as Markdown
