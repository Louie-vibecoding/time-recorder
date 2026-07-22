# Time Recorder

An Obsidian plugin for **two-click time tracking**. Punch in what you're doing right now, back-fill missed segments on a 24-hour timeline, and get live daily / weekly / monthly summaries. All your data lives in your own Markdown files. Desktop and Android from a single codebase; the UI is bilingual and follows Obsidian's interface language (English / 简体中文).

让你**两次点击就能完成一次打卡**的 Obsidian 时间记录插件。实时打卡、在 24 小时时间轴上补录漏掉的时段、自动生成今日 / 本周 / 本月汇总。所有数据都保存在你自己的 Markdown 文件里。桌面端与安卓端同一套代码，界面中英双语、跟随 Obsidian 界面语言。

## Features · 功能

- **Two-click punch-in** — open the grid, tap a category (or type a custom activity); the previous segment auto-closes. 两次点击打卡：打开九宫格点一下分类（也可输入自定义活动），上一段自动收尾。
- **Timeline back-fill** — tap a gap on the 24-hour timeline to add a segment, tap a block to edit or delete; drag edges to resize on desktop. 时间轴补录：在 24 小时时间轴上点空隙补录、点色块编辑或删除，桌面端可拖动边缘调整时长。
- **Live summaries** — today / week / month breakdown by category with prev/next navigation; copy as a Markdown table. 实时汇总：今日 / 本周 / 本月按分类统计、支持前后翻页，可一键复制为 Markdown 表格。
- **⚡ Flash note** — jump straight to the end of a chosen note from the punch-in grid, cursor ready to type. 闪记：从打卡面板一键跳到指定笔记末尾，光标就位、直接输入。
- **Undo & status** — one-tap undo for the latest punch; the status bar (desktop) or ribbon tooltip (Android) shows what's in progress. 撤销与状态：最近一次打卡可一键撤销；状态栏（桌面）/ 功能区提示（安卓）显示进行中的活动。
- **Your categories, your data** — add / rename / remove categories and keywords in settings, restore defaults anytime; category names are never auto-translated, and keyword bridging keeps records written before a language switch correctly categorized. 分类即数据：在设置里增删改分类与关键词、随时恢复默认；分类名绝不会被自动翻译，切换界面语言后，关键词桥接让旧记录照常正确归类。
- **Data safety** — a corrupted settings file falls back to defaults with an automatic backup and a plain-language notice. 数据安全：设置文件损坏时自动回退默认值、备份坏文件，并用明白话提醒你。

## Installation · 安装

Obsidian → Settings → Community plugins → Browse → search **"Time Recorder"** → Install → Enable.

Obsidian → 设置 → 第三方插件 → 浏览 → 搜索 **"Time Recorder"** → 安装 → 启用。

> **Android sync tip · 安卓同步提示**: Obsidian Sync does not sync community plugins by default — turn on *Sync → Sync configuration → Installed community plugins* on both devices. Obsidian Sync 默认不同步第三方插件，请在电脑和手机两端同时开启「同步 → 同步配置 → 已安装的第三方插件」。

## File format · 数据格式

One Markdown file per day, one line per segment / 每天一个 Markdown 文件，每行一段：

```
- [ ] 08:30 - 10:00 学习obsidian
```

An end time of `ing` means the segment is still open. Categories are inferred from the activity name at read time and are never written into the file — your history stays plain, portable Markdown, and hand-written records in this format just work.

结束时间 `ing` 表示该段仍在进行中。分类在读取时由活动名推断、不写入文件——历史记录始终是纯粹、可迁移的 Markdown，手写的同格式记录也能直接识别。

## Version history · 版本记录

- **1.0.4** (2026-07-22) — ⚡ Flash note: jump to the end of a chosen note from the punch-in grid. 新增闪记：从打卡面板一键跳到指定笔记末尾。
- **1.0.3** (2026-07-15) — "Restore default categories" bridges languages, so pre-switch records still categorize correctly. 「恢复默认分类」支持跨语言桥接，切换语言前的记录照常归类。
- **1.0.2** (2026-07-15) — Bilingual UI following Obsidian's interface language. 界面双语化，跟随 Obsidian 界面语言。
- **1.0.1** (2026-07-15) — Compliance fixes from community review; automated CI releases. 社区审核合规修复；CI 自动发版。
- **1.0.0** (2026-07-15) — Initial release: grid punch-in, timeline back-fill, summaries, undo, data guard. 首发：九宫格打卡、时间轴补录、汇总、撤销、数据守卫。

Full changelog · 完整日志：[CHANGELOG](https://github.com/Louie-vibecoding/time-recorder/blob/master/CHANGELOG.md) / [Releases](https://github.com/Louie-vibecoding/time-recorder/releases)

## License

MIT
