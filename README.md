# Time Recorder

An Obsidian plugin for **two-click time tracking**. Record what you're doing right now, back-fill missed segments on a timeline, and get a live daily summary. Inspired by Chinese time-tracking apps like 爱时间 and 时间日志 — but all your data lives in your own Markdown files.

Works on **Desktop and Android** from a single codebase.

[中文说明 →](./README.zh.md)

## Features

- **Grid punch-in**: open a modal, tap a category — the previous open segment auto-closes and a new one starts. Two clicks total.
- **Custom activity**: type a free-text activity name and pick a category for grouping.
- **Timeline back-fill**: a 24-hour vertical timeline. Click an empty slot to add a segment (with smart-fill range to the next one), click an existing block to edit or delete. On desktop, drag the top/bottom edges to resize (snaps to 5 minutes).
- **Today summary**: a sidebar (desktop) or full-screen view (Android) showing the breakdown by category. Copy it as a Markdown table for your daily review or to hand to an LLM.
- **1-step undo** on the latest punch.
- **Status bar** (desktop) / **ribbon tooltip** (Android) shows what's currently in progress.
- **Editable settings**: add / remove / rename categories, edit their keywords and the records folder — all from the settings tab, no file editing required. Restore defaults anytime.
- **Robust data guard**: if the settings file is ever corrupted, the plugin falls back to defaults, backs up the broken file (`data.json.bak`), and tells you in plain language — it never silently loses your data, and never downgrades settings written by a newer version on another device.
- **Auto-create** today's record file on startup, so you can punch in immediately.

## Installation

### From Community Plugins (when released)

1. Obsidian → Settings → Community plugins → Browse
2. Search "Time Recorder"
3. Install → Enable

### Manual

1. Download `manifest.json`, `main.js`, and `styles.css` from the latest [release](https://github.com/Louie-vibecoding/time-recorder/releases)
2. Put them in `<your-vault>/.obsidian/plugins/time-recorder/`
3. Reload Obsidian → enable the plugin

### Android setup (recommended)

1. Settings → Mobile → Toolbar (or use the ribbon icons)
2. Add "Time Recorder: Punch in" to the first position

> **Android sync note**: Obsidian Sync does **not** sync community plugins by default. On the PC, turn on Settings → Sync → Sync configuration → Installed community plugins, and turn on the **same** switch on Android. Also add `.obsidian/plugins/time-recorder/node_modules` to your Sync exclusions to avoid syncing a large dev folder.

## File format

Each daily record file is `<records-folder>/{YYYY-M-D} 时间记录.md`. Each segment is one line:

```
- [ ] 08:30 - 10:00 学习obsidian
```

- An end time of `ing` means the segment is still open (in progress). Legacy records that used `00:00` for "open" are still read correctly.
- Existing records written by hand in this format work without modification.
- A category is **inferred from the activity name** at read time (it is not stored in the file), so adding, renaming, or removing categories never touches your historical records.

## Settings

| Setting | Default | What it does |
|---|---|---|
| Records folder | `反省日志/时间记录` | Where daily files live |
| Template path | `反省日志/时间记录/timer template.md` | Optional template copied when a new day file is created |
| Categories | 10 defaults + 其他 | Add / remove / rename, and edit each category's keywords, directly in the settings tab |

The default categories are: 😴 睡眠 / 📚 学习 / 🍱 饮食 / 🚿 个人卫生 / 🚗 通勤 / 💬 社交 / 🧹 家务 / 💼 工作 / 🏃 运动 / 🎮 娱乐, plus a fixed ❓ 其他 fallback.

## Roadmap

- 1.1: multi-step undo, segment cut/paste, week/month summary
- 1.2: summary charts
- 1.3: tag dimension, Android notifications, Tasker integration

## License

MIT — see [LICENSE](./LICENSE).
