/**
 * 双语文案（zh / en）。
 *
 * 原则（决策 #28）：
 * - zh 值 = 1.0.1 及之前的界面原文，逐字一致 —— 中文用户升级后体验零变化。
 * - 现在已是英文的文案（命令名、ribbon 提示、视图名）不进字典，保持原样。
 * - 数据层格式（记录文件名 "YYYY-M-D 时间记录.md"、records 行格式）永不随语言变，
 *   否则切换界面语言会导致旧文件“失踪”。
 * - 语言检测读 Obsidian 的 localStorage["language"]（中文界面 = "zh"/"zh-TW"），
 *   拿不到一律按英文。只在首次调用时读取并缓存（Obsidian 改语言要重启，缓存安全）。
 */
import { ZH_MARKDOWN_STRINGS, MarkdownStrings } from "./summarize";
import { REL_DAY_LABELS, RelDayLabels } from "./date";
import { ZH_SEGMENT_TIME_MESSAGES, SegmentTimeMessages } from "./segmentEdit";
import { ZH_CATEGORY_NAME_MESSAGES, CategoryNameMessages } from "./settingsValidation";

export type Lang = "zh" | "en";

/** 纯函数：原始 locale 串 → 语言。"zh"/"zh-TW"/"ZH-cn" → zh；其余（含 null）→ en。 */
export function resolveLang(raw: string | null | undefined): Lang {
  return raw && raw.toLowerCase().startsWith("zh") ? "zh" : "en";
}

let cachedLang: Lang | null = null;

export function getLang(): Lang {
  if (cachedLang === null) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem("language");
    } catch {
      raw = null;
    }
    cachedLang = resolveLang(raw);
  }
  return cachedLang;
}

/** 仅测试用：重置语言缓存。 */
export function __resetLangCache(): void {
  cachedLang = null;
}

/** "{key}" 占位替换；未提供的占位原样保留。 */
export function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

const zh = {
  // main
  corruptSettings:
    "⏱️ 时间记录仪：你的设置文件好像出了点小问题，已经先用默认设置顶上了。原来的设置我自动留了备份、没丢，需要的话能帮你找回。",
  // 打卡九宫格 GridModal
  cellCustom: "自定义…",
  btnUndo: "↶ 撤销",
  btnToday: "📄 今日",
  btnSummary: "📊 汇总",
  btnTimeline: "📅 时间轴",
  btnClose: "✕ 关闭",
  nowDoing: "现在在做：{emoji} {activity}（{start} 起 {dur}）",
  notStarted: "尚未开始任何活动",
  undone: "已撤销 ✅",
  nothingToUndo: "没有可撤销的操作",
  punchFailed: "打卡失败：",
  // 自定义活动 CustomActivityModal
  customTitle: "自定义活动",
  customWhat: "做什么？",
  customPlaceholder: "例如：写时间记录仪插件",
  cancel: "取消",
  confirmPunch: "确定打卡",
  emptyActivity: "活动名不能为空",
  // openTodayFile
  openTodayFailed: "打开今日记录失败：",
  punchSuccess: "✅ {activity} {now} 起（点这里打开今日记录）",
  // 时间段编辑器 SegmentEditorModal
  segTitleNew: "新建时间段",
  segTitleEdit: "编辑时间段",
  segStart: "开始",
  segEnd: "结束（留空 = 进行中）",
  segDesc: "描述（可留空，留空记为「未命名」；分类按描述自动判断）",
  segDelete: "删除",
  segSave: "保存",
  segInvalidTime: "时间无效",
  segUnnamed: "未命名",
  segUpdatedDone: "已更新 ✅",
  segUpdatedIng: "已更新（进行中）✅",
  segCreatedDone: "已新建 ✅",
  segCreatedIng: "已新建（进行中）✅",
  saveFailed: "保存失败：",
  deleted: "已删除 ✅",
  deleteFailed: "删除失败：",
  // 设置页 SettingsTab
  setFolderName: "记录文件夹",
  setFolderDesc: "时间记录 .md 文件所在文件夹。改此项不会自动搬移已有记录文件（旧文件留原处）。",
  setTemplateName: "模板路径",
  setTemplateDesc: "新建当天记录文件时套用的模板。",
  setCatHeading: "分类 / Categories",
  setCatHint: "活动名自动按「名字 / 关键词」归类。关键词用逗号分隔。改名 / 换 emoji / 删类都不会改动历史记录。",
  otherName: "其他",
  otherDesc: "兜底分类：无法归类的活动都计入这里。固定存在、不可删除、不可配关键词。",
  addCat: "+ 新增分类",
  resetCats: "恢复默认分类",
  resetConfirm: "确定用出厂默认分类覆盖当前所有分类？此操作无法撤销。",
  catNamePh: "分类名",
  aliasPh: "关键词，逗号分隔",
  delCatTip: "删除此分类",
  ok: "确定",
  // 状态栏
  statusIdle: "⏱ 未开始",
  // 时间轴 TimelineView
  tlPrev: "< 昨天",
  tlNext: "明天 >",
  tlToday: "今天",
  // 汇总 TodaySummaryView
  sumTabToday: "今天",
  sumTabWeek: "本周",
  sumTabMonth: "本月",
  sumPrevDay: "‹ 昨天",
  sumTodayBtn: "今天",
  sumNextDay: "明天 ›",
  sumRecorded24: "已记录 {dur} / 24h（{pct}%）",
  copySummary: "📋 复制汇总文本",
  weekLabel: "本周",
  monthLabel: "本月",
  prevWeek: "‹ 上一周",
  prevMonth: "‹ 上月",
  nextWeek: "下一周 ›",
  nextMonth: "下月 ›",
  sumRecordedElapsed: "已记录 {dur} / 已过去 {elapsed}（{pct}%）",
  dailyAvg: "日均 {dur}",
  thRank: "排",
  thCat: "类别",
  thDur: "时长",
  thPct: "占比",
  unrecordedRow: "⚪ 未记录",
  copied: "已复制到剪贴板 ✅",
  copyFailed: "复制失败：",
};

const en: typeof zh = {
  corruptSettings:
    "⏱️ Time Recorder: your settings file had a problem, so defaults were loaded for now. The original file was backed up automatically — nothing is lost.",
  cellCustom: "Custom…",
  btnUndo: "↶ Undo",
  btnToday: "📄 Today",
  btnSummary: "📊 Summary",
  btnTimeline: "📅 Timeline",
  btnClose: "✕ Close",
  nowDoing: "Now doing: {emoji} {activity} (since {start}, {dur})",
  notStarted: "No activity in progress",
  undone: "Undone ✅",
  nothingToUndo: "Nothing to undo",
  punchFailed: "Punch-in failed: ",
  customTitle: "Custom activity",
  customWhat: "What are you doing?",
  customPlaceholder: "e.g. Writing my weekly review",
  cancel: "Cancel",
  confirmPunch: "Punch in",
  emptyActivity: "Activity name cannot be empty",
  openTodayFailed: "Failed to open today's record: ",
  punchSuccess: "✅ {activity} since {now} (tap to open today's record)",
  segTitleNew: "New segment",
  segTitleEdit: "Edit segment",
  segStart: "Start",
  segEnd: "End (leave empty = in progress)",
  segDesc: 'Description (optional; empty = "Untitled"; category is inferred from it)',
  segDelete: "Delete",
  segSave: "Save",
  segInvalidTime: "Invalid time",
  segUnnamed: "Untitled",
  segUpdatedDone: "Updated ✅",
  segUpdatedIng: "Updated (in progress) ✅",
  segCreatedDone: "Created ✅",
  segCreatedIng: "Created (in progress) ✅",
  saveFailed: "Save failed: ",
  deleted: "Deleted ✅",
  deleteFailed: "Delete failed: ",
  setFolderName: "Records folder",
  setFolderDesc: "Folder for time-record .md files. Changing this does not move existing files.",
  setTemplateName: "Template path",
  setTemplateDesc: "Template applied when creating a day's record file.",
  setCatHeading: "Categories",
  setCatHint: "Activities are categorized by name / keywords (comma-separated). Renaming, changing emoji, or deleting a category never rewrites past records.",
  otherName: "Other",
  otherDesc: "Fallback category for anything unmatched. Always present; cannot be deleted or given keywords.",
  addCat: "+ Add category",
  resetCats: "Restore default categories",
  resetConfirm: "Replace all current categories with the factory defaults? This cannot be undone.",
  catNamePh: "Category name",
  aliasPh: "Keywords, comma-separated",
  delCatTip: "Delete this category",
  ok: "OK",
  statusIdle: "⏱ Idle",
  tlPrev: "< Prev day",
  tlNext: "Next day >",
  tlToday: "Today",
  sumTabToday: "Today",
  sumTabWeek: "This week",
  sumTabMonth: "This month",
  sumPrevDay: "‹ Prev day",
  sumTodayBtn: "Today",
  sumNextDay: "Next day ›",
  sumRecorded24: "Recorded {dur} / 24h ({pct}%)",
  copySummary: "📋 Copy as Markdown",
  weekLabel: "This week",
  monthLabel: "This month",
  prevWeek: "‹ Prev week",
  prevMonth: "‹ Prev month",
  nextWeek: "Next week ›",
  nextMonth: "Next month ›",
  sumRecordedElapsed: "Recorded {dur} / {elapsed} elapsed ({pct}%)",
  dailyAvg: "Daily avg {dur}",
  thRank: "#",
  thCat: "Category",
  thDur: "Duration",
  thPct: "Share",
  unrecordedRow: "⚪ Unrecorded",
  copied: "Copied to clipboard ✅",
  copyFailed: "Copy failed: ",
};

export const STRINGS: Record<Lang, typeof zh> = { zh, en };

export type StringKey = keyof typeof zh;

export function t(key: StringKey): string {
  return STRINGS[getLang()][key];
}

// ---------- 纯函数模块的文案包（zh 复用各模块导出的默认值，单一来源防漂移） ----------

const EN_MARKDOWN_STRINGS: MarkdownStrings = {
  headingTpl: "## Time summary ({title})",
  tableHeader: "| # | Category | Duration | Share | Activities |",
  unrecordedLabel: "⚪ Unrecorded",
  totalLabel: "Total",
};

export function mdStrings(): MarkdownStrings {
  return getLang() === "zh" ? ZH_MARKDOWN_STRINGS : EN_MARKDOWN_STRINGS;
}

const EN_REL_DAY_LABELS: RelDayLabels = {
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
};

export function relDayLabels(): RelDayLabels {
  return getLang() === "zh" ? REL_DAY_LABELS : EN_REL_DAY_LABELS;
}

const EN_SEGMENT_TIME_MESSAGES: SegmentTimeMessages = {
  startInvalid: "Invalid start time",
  endInvalid: "Invalid end time",
  endNotAfterStart: "End time must be after start time",
};

export function segmentTimeMessages(): SegmentTimeMessages {
  return getLang() === "zh" ? ZH_SEGMENT_TIME_MESSAGES : EN_SEGMENT_TIME_MESSAGES;
}

const EN_CATEGORY_NAME_MESSAGES: CategoryNameMessages = {
  empty: "Category name cannot be empty",
  duplicate: "Category name already exists",
};

export function categoryNameMessages(): CategoryNameMessages {
  return getLang() === "zh" ? ZH_CATEGORY_NAME_MESSAGES : EN_CATEGORY_NAME_MESSAGES;
}
