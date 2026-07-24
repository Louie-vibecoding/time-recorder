# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## 1.0.6 — 2026-07-24

### Added
- **Monthly heatmap**: the month summary now shows a calendar heatmap below the stats table — one cell per day (weeks start on Monday), green intensity reflects recorded hours (<2h / 2–6h / 6–12h / 12h+), today is outlined, and tapping a day shows its recorded total. Days follow the record files' local dates; empty auto-created files don't count as recorded.

### Changed
- **Phone layout**: the punch-in grid now fits on one screen — 3 columns on mainstream phones (the 2-column fallback is reserved for ≤320px screens), cell height adapts to the category count with a 56px floor, and the footer buttons keep clear of the system navigation bar.

## 1.0.5 — 2026-07-23

### Added
- **Language setting**: a dropdown at the top of the settings tab — Follow Obsidian (default) / 简体中文 / English / 日本語 / 한국어. Japanese and Korean are fully supported (all UI text plus native default category sets). Switching applies instantly — no restart needed.
- **Per-category language follow**: default categories you never modified switch to the new language automatically, with cross-language keyword bridging so records written in any language still categorize correctly. Categories you added or edited are kept as-is (a one-time note in settings explains what changed and what didn't). Record files, folders and history are never touched by a language switch.

### Changed
- "Restore default categories" now bridges keywords across all four languages (was Chinese ↔ English only).
- "Follow Obsidian" now detects Japanese and Korean interface locales (previously fell back to English).
- Clearing the records-folder or template-path input now keeps the last saved value instead of refilling a language default, so the folder can never silently point away from your existing records.

## 1.0.4 — 2026-07-22

### Added
- **⚡ Flash note (闪记)**: a new button in the punch-in grid footer plus a `Flash note` command (bindable to a hotkey or the mobile toolbar) that jumps straight to the end of a chosen note — cursor lands on the last line, ready to type. Configure the target note in settings, or just click the button: if unset, a fuzzy picker (vault notes, most recently modified first) opens and your pick is remembered. A renamed or deleted target shows a notice and falls back to the picker; reading view switches to edit mode on jump.

## 1.0.3 — 2026-07-15

### Changed
- **"Restore default categories" now bridges languages**: restored categories carry the other language's category names and keywords as aliases, so records written before switching Obsidian's interface language still categorize correctly (nothing falls into Other). Fresh installs keep clean, single-language keyword lists.
- Docs: merged the Chinese introduction into the main README and removed `README.zh.md` (its relative link was not clickable on the plugin listing page).

## 1.0.2 — 2026-07-15

### Added
- **Bilingual UI (English / Simplified Chinese)**: all interface text — punch-in grid, modals, timeline, summary view, settings tab, notices, and copied Markdown summaries — now follows Obsidian's interface language (Chinese → Chinese, anything else → English). Chinese users see exactly the same UI as before.
- English default categories, keywords, and records-folder path (`Time Records`) for fresh installs on non-Chinese Obsidian. Existing users' settings are never touched; category ids are shared across languages so colors and categorization stay stable.

### Notes
- The record filename format (`YYYY-M-D 时间记录.md`) is a data-layer convention and intentionally stays identical across languages, so switching the interface language never orphans existing records.

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
