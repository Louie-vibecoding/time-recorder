/**
 * 多语言文案（zh / en / ja / ko）。
 *
 * 原则（决策 #28）：
 * - zh 值 = 1.0.1 及之前的界面原文，逐字一致 —— 中文用户升级后体验零变化。
 * - 现在已是英文的文案（命令名、ribbon 提示、视图名）不进字典，保持原样。
 * - 数据层格式（记录文件名 "YYYY-M-D 时间记录.md"、records 行格式）永不随语言变，
 *   否则切换界面语言会导致旧文件“失踪”。
 * - 语言解析：用户在设置里显式选择的语言（setLangOverride）永远优先；
 *   "auto" 时读 Obsidian 的 localStorage["language"]，拿不到一律按英文，
 *   只在首次调用时读取并缓存（Obsidian 改语言要重启，检测值缓存安全）。
 * - 新字典必须 `const xx: typeof zh = {...}` 声明，编译期锁 key 齐全。
 */
import { ZH_MARKDOWN_STRINGS, MarkdownStrings } from "./summarize";
import { REL_DAY_LABELS, RelDayLabels } from "./date";
import { ZH_SEGMENT_TIME_MESSAGES, SegmentTimeMessages } from "./segmentEdit";
import { ZH_CATEGORY_NAME_MESSAGES, CategoryNameMessages } from "./settingsValidation";
import { Lang } from "./types";

export type { Lang };

/** 语言自称（下拉选项 / Notice 用，恒定母语显示，不进翻译字典）。 */
export const LANG_NAMES: Record<Lang, string> = {
  zh: "简体中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
};

/** 纯函数：原始 locale 串 → 语言。zh* → zh（含繁体，沿用简中字典）；ja* → ja；ko* → ko；其余（含 null）→ en。 */
export function resolveLang(raw: string | null | undefined): Lang {
  if (!raw) return "en";
  const lower = raw.toLowerCase();
  if (lower.startsWith("zh")) return "zh";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("ko")) return "ko";
  return "en";
}

let cachedLang: Lang | null = null;
let langOverride: Lang | null = null;

/**
 * 显式语言覆盖（设置里的「界面语言」）。null = 跟随 Obsidian 自动检测。
 * 必须在 loadSettings 迁移完成后、第一条用户可见文案生成前调用。
 */
export function setLangOverride(lang: Lang | null): void {
  langOverride = lang;
}

/** 生效语言：显式覆盖优先，否则用缓存的 Obsidian 界面语言检测值。 */
export function getLang(): Lang {
  if (langOverride) return langOverride;
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

/** 仅测试用：重置语言缓存与覆盖。 */
export function __resetLangCache(): void {
  cachedLang = null;
  langOverride = null;
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
  // 闪记 flashNote
  btnFlash: "⚡ 闪记",
  flashPickerPlaceholder: "选一篇笔记作为闪记目标（会记住，下次直达）",
  flashTargetSaved: "⚡ 闪记目标已设为：{path}",
  flashTargetMissing: "闪记目标「{path}」不存在，请重新选一篇",
  flashOpenFailed: "打开闪记笔记失败：",
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
  setLangName: "界面语言",
  setLangDesc:
    "插件界面文字的语言。「跟随 Obsidian」自动匹配 Obsidian 界面语言。切换后：界面按钮与文字立即全部切换；没有修改过的默认分类自动换成对应语言；你新增或修改过的分类原样保留；记录文件、文件夹和历史记录永远不受影响。",
  langAuto: "跟随 Obsidian（默认）",
  catsFollowedLang: "✅ 未修改的默认分类已切换为{lang}，历史记录不受影响",
  langCatHint:
    "你新增或修改过的分类已原样保留，不会随语言自动改动。想翻译它们，直接在下方编辑分类名即可。",
  setFolderName: "记录文件夹",
  setFolderDesc: "时间记录 .md 文件所在文件夹。改此项不会自动搬移已有记录文件（旧文件留原处）。",
  setTemplateName: "模板路径",
  setTemplateDesc: "新建当天记录文件时套用的模板。",
  setFlashName: "闪记目标笔记",
  setFlashDesc: "点击打卡面板的「⚡ 闪记」按钮，直接跳到这篇笔记末尾接着写。留空 = 首次点击时从列表里选（选一次就记住）。",
  setFlashPh: "例如：收集箱.md",
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
  heatTitle: "月热力图",
  heatWeekdays: "一二三四五六日",
  heatDayDetail: "{date}：已记录 {dur}",
  heatDayEmpty: "{date}：未记录",
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
  btnFlash: "⚡ Flash note",
  flashPickerPlaceholder: "Pick a note as the flash-note target (remembered for next time)",
  flashTargetSaved: "⚡ Flash note target set: {path}",
  flashTargetMissing: 'Flash note target "{path}" not found — pick a new one',
  flashOpenFailed: "Failed to open flash note: ",
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
  setLangName: "Language",
  setLangDesc:
    "Language of the plugin UI. 'Follow Obsidian' matches Obsidian's interface language. On switch: all UI text changes immediately; default categories you never modified follow the new language; categories you added or edited are kept as-is; record files, folders and history are never touched.",
  langAuto: "Follow Obsidian (default)",
  catsFollowedLang: "✅ Unmodified default categories switched to {lang} — your records are untouched",
  langCatHint:
    "Categories you added or edited were kept as-is and never switch automatically. To translate them, just edit their names below.",
  setFolderName: "Records folder",
  setFolderDesc: "Folder for time-record .md files. Changing this does not move existing files.",
  setTemplateName: "Template path",
  setTemplateDesc: "Template applied when creating a day's record file.",
  setFlashName: "Flash note target",
  setFlashDesc: "The note the ⚡ Flash note button in the punch-in grid jumps to — cursor lands at the end, ready to type. Leave empty to pick from a list on first click (one pick is remembered).",
  setFlashPh: "e.g. Inbox.md",
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
  heatTitle: "Monthly heatmap",
  heatWeekdays: "MTWTFSS",
  heatDayDetail: "{date}: {dur} recorded",
  heatDayEmpty: "{date}: no records",
  copied: "Copied to clipboard ✅",
  copyFailed: "Copy failed: ",
};

const ja: typeof zh = {
  corruptSettings:
    "⏱️ Time Recorder：設定ファイルに問題があったため、いったんデフォルト設定を読み込みました。元の設定は自動でバックアップ済みなので、何も失われていません。",
  cellCustom: "カスタム",
  btnUndo: "↶ 元に戻す",
  btnToday: "📄 今日",
  btnSummary: "📊 集計",
  btnTimeline: "📅 時間軸",
  btnClose: "✕ 閉じる",
  nowDoing: "進行中：{emoji} {activity}（{start} から {dur}）",
  notStarted: "進行中の活動はありません",
  undone: "元に戻しました ✅",
  nothingToUndo: "元に戻せる操作はありません",
  punchFailed: "打刻に失敗しました：",
  customTitle: "カスタム活動",
  customWhat: "何をしていますか？",
  customPlaceholder: "例：週次レビューを書く",
  cancel: "キャンセル",
  confirmPunch: "打刻",
  emptyActivity: "活動名を入力してください",
  openTodayFailed: "今日の記録を開けませんでした：",
  punchSuccess: "✅ {activity} {now} から（タップで今日の記録を開く）",
  btnFlash: "⚡ メモ",
  flashPickerPlaceholder: "クイックメモの保存先ノートを選択（記憶され、次回から直接開きます）",
  flashTargetSaved: "⚡ クイックメモの保存先を設定しました：{path}",
  flashTargetMissing: "クイックメモの保存先「{path}」が見つかりません。もう一度選んでください",
  flashOpenFailed: "クイックメモを開けませんでした：",
  segTitleNew: "時間帯の新規作成",
  segTitleEdit: "時間帯の編集",
  segStart: "開始",
  segEnd: "終了（空欄 = 進行中）",
  segDesc: "説明（空欄可。空欄の場合は「無題」として記録。カテゴリは説明から自動判定）",
  segDelete: "削除",
  segSave: "保存",
  segInvalidTime: "時刻が無効です",
  segUnnamed: "無題",
  segUpdatedDone: "更新しました ✅",
  segUpdatedIng: "更新しました（進行中）✅",
  segCreatedDone: "作成しました ✅",
  segCreatedIng: "作成しました（進行中）✅",
  saveFailed: "保存に失敗しました：",
  deleted: "削除しました ✅",
  deleteFailed: "削除に失敗しました：",
  setLangName: "表示言語",
  setLangDesc:
    "プラグイン UI の表示言語。「Obsidian に従う」を選ぶと Obsidian の表示言語に自動で合わせます。切り替え時：UI の文字はすべて即時切り替わります。未変更のデフォルトカテゴリは新しい言語に自動で切り替わり、追加・編集したカテゴリはそのまま保持されます。記録ファイル・フォルダ・過去の記録には一切影響しません。",
  langAuto: "Obsidian に従う（デフォルト）",
  catsFollowedLang: "✅ 未変更のデフォルトカテゴリを{lang}に切り替えました。過去の記録に影響はありません",
  langCatHint:
    "追加・編集したカテゴリはそのまま保持され、言語切り替えでは変更されません。翻訳したい場合は、下でカテゴリ名を直接編集してください。",
  setFolderName: "記録フォルダ",
  setFolderDesc: "時間記録の .md ファイルを保存するフォルダ。変更しても既存の記録ファイルは移動されません（元の場所に残ります）。",
  setTemplateName: "テンプレートパス",
  setTemplateDesc: "その日の記録ファイルを新規作成するときに適用されるテンプレート。",
  setFlashName: "クイックメモの保存先ノート",
  setFlashDesc:
    "打刻パネルの「⚡ メモ」ボタンを押すと、このノートの末尾にジャンプしてすぐ書き始められます。空欄の場合は初めて使うときに一覧から選択します（一度選べば記憶されます）。",
  setFlashPh: "例：Inbox.md",
  setCatHeading: "カテゴリ",
  setCatHint:
    "活動名は「カテゴリ名 / キーワード」で自動分類されます。キーワードはカンマ区切り。名前や絵文字を変えたり、カテゴリを削除したりしても、過去の記録は書き換えられません。",
  otherName: "その他",
  otherDesc: "どのカテゴリにも当てはまらない活動の受け皿。常に存在し、削除もキーワード設定もできません。",
  addCat: "+ カテゴリ追加",
  resetCats: "デフォルトに戻す",
  resetConfirm: "現在のカテゴリをすべてデフォルトのカテゴリに置き換えますか？この操作は取り消せません。",
  catNamePh: "カテゴリ名",
  aliasPh: "キーワード（カンマ区切り）",
  delCatTip: "このカテゴリを削除",
  ok: "OK",
  statusIdle: "⏱ 待機中",
  tlPrev: "< 前日",
  tlNext: "翌日 >",
  tlToday: "今日",
  sumTabToday: "今日",
  sumTabWeek: "今週",
  sumTabMonth: "今月",
  sumPrevDay: "‹ 前日",
  sumTodayBtn: "今日",
  sumNextDay: "翌日 ›",
  sumRecorded24: "記録済み {dur} / 24h（{pct}%）",
  copySummary: "📋 集計をコピー",
  weekLabel: "今週",
  monthLabel: "今月",
  prevWeek: "‹ 前週",
  prevMonth: "‹ 前月",
  nextWeek: "翌週 ›",
  nextMonth: "翌月 ›",
  sumRecordedElapsed: "記録済み {dur} / 経過 {elapsed}（{pct}%）",
  dailyAvg: "1日平均 {dur}",
  thRank: "順位",
  thCat: "分類",
  thDur: "時間",
  thPct: "割合",
  unrecordedRow: "⚪ 未記録",
  heatTitle: "月間ヒートマップ",
  heatWeekdays: "月火水木金土日",
  heatDayDetail: "{date}：記録 {dur}",
  heatDayEmpty: "{date}：未記録",
  copied: "クリップボードにコピーしました ✅",
  copyFailed: "コピーに失敗しました：",
};

const ko: typeof zh = {
  corruptSettings:
    "⏱️ Time Recorder: 설정 파일에 문제가 있어 일단 기본 설정을 불러왔습니다. 원래 설정은 자동으로 백업해 두었으니 유실된 내용은 없습니다.",
  cellCustom: "직접 입력…",
  btnUndo: "↶ 되돌리기",
  btnToday: "📄 오늘",
  btnSummary: "📊 요약",
  btnTimeline: "📅 타임라인",
  btnClose: "✕ 닫기",
  nowDoing: "지금 하는 일: {emoji} {activity} ({start}부터, {dur})",
  notStarted: "진행 중인 활동이 없습니다",
  undone: "되돌렸습니다 ✅",
  nothingToUndo: "되돌릴 작업이 없습니다",
  punchFailed: "기록 실패: ",
  customTitle: "활동 직접 입력",
  customWhat: "무엇을 하고 있나요?",
  customPlaceholder: "예: 주간 회고 쓰기",
  cancel: "취소",
  confirmPunch: "기록 시작",
  emptyActivity: "활동 이름을 입력해 주세요",
  openTodayFailed: "오늘 기록 열기 실패: ",
  punchSuccess: "✅ {activity} {now}부터 (눌러서 오늘 기록 열기)",
  btnFlash: "⚡ 빠른 메모",
  flashPickerPlaceholder: "빠른 메모 대상 노트를 선택하세요 (선택하면 기억되어 다음부터 바로 열립니다)",
  flashTargetSaved: "⚡ 빠른 메모 대상을 설정했습니다: {path}",
  flashTargetMissing: "빠른 메모 대상 '{path}'을(를) 찾을 수 없습니다. 다시 선택해 주세요",
  flashOpenFailed: "빠른 메모 노트 열기 실패: ",
  segTitleNew: "새 시간 구간",
  segTitleEdit: "시간 구간 편집",
  segStart: "시작",
  segEnd: "종료 (비워 두면 진행 중)",
  segDesc: "설명 (비워 두면 '이름 없음'으로 기록되며, 분류는 설명에 따라 자동 판별됩니다)",
  segDelete: "삭제",
  segSave: "저장",
  segInvalidTime: "시간이 올바르지 않습니다",
  segUnnamed: "이름 없음",
  segUpdatedDone: "수정했습니다 ✅",
  segUpdatedIng: "수정했습니다 (진행 중) ✅",
  segCreatedDone: "추가했습니다 ✅",
  segCreatedIng: "추가했습니다 (진행 중) ✅",
  saveFailed: "저장 실패: ",
  deleted: "삭제했습니다 ✅",
  deleteFailed: "삭제 실패: ",
  setLangName: "언어",
  setLangDesc:
    "플러그인 UI 텍스트의 언어입니다. 'Obsidian 따르기'를 선택하면 Obsidian 인터페이스 언어에 자동으로 맞춥니다. 전환 시: UI 텍스트는 모두 즉시 바뀝니다. 수정한 적 없는 기본 분류는 새 언어로 자동 전환되고, 직접 추가하거나 수정한 분류는 그대로 유지됩니다. 기록 파일, 폴더, 과거 기록은 절대 변경되지 않습니다.",
  langAuto: "Obsidian 따르기 (기본값)",
  catsFollowedLang: "✅ 수정하지 않은 기본 분류를 {lang}(으)로 전환했습니다. 과거 기록은 그대로 유지됩니다",
  langCatHint:
    "직접 추가하거나 수정한 분류는 그대로 유지되며, 언어 전환 시 자동으로 바뀌지 않습니다. 번역하려면 아래에서 분류 이름을 직접 수정하세요.",
  setFolderName: "기록 폴더",
  setFolderDesc: "시간 기록 .md 파일을 저장하는 폴더입니다. 이 설정을 바꿔도 기존 기록 파일은 옮겨지지 않습니다 (원래 자리에 그대로 남습니다).",
  setTemplateName: "템플릿 경로",
  setTemplateDesc: "그날의 기록 파일을 새로 만들 때 적용할 템플릿입니다.",
  setFlashName: "빠른 메모 대상 노트",
  setFlashDesc:
    "기록 패널의 '⚡ 빠른 메모' 버튼을 누르면 이 노트의 맨 끝으로 바로 이동해 이어서 쓸 수 있습니다. 비워 두면 처음 누를 때 목록에서 선택합니다 (한 번 선택하면 기억됩니다).",
  setFlashPh: "예: 인박스.md",
  setCatHeading: "분류",
  setCatHint:
    "활동 이름은 '이름 / 키워드'에 따라 자동으로 분류됩니다. 키워드는 쉼표로 구분합니다. 이름 변경, 이모지 변경, 분류 삭제는 과거 기록을 바꾸지 않습니다.",
  otherName: "기타",
  otherDesc: "분류할 수 없는 활동이 모두 여기에 집계됩니다. 항상 존재하며, 삭제하거나 키워드를 지정할 수 없습니다.",
  addCat: "+ 분류 추가",
  resetCats: "기본 분류 복원",
  resetConfirm: "현재 모든 분류를 기본 분류로 덮어쓰시겠습니까? 이 작업은 되돌릴 수 없습니다.",
  catNamePh: "분류 이름",
  aliasPh: "키워드 (쉼표로 구분)",
  delCatTip: "이 분류 삭제",
  ok: "확인",
  statusIdle: "⏱ 대기 중",
  tlPrev: "< 어제",
  tlNext: "내일 >",
  tlToday: "오늘",
  sumTabToday: "오늘",
  sumTabWeek: "이번 주",
  sumTabMonth: "이번 달",
  sumPrevDay: "‹ 어제",
  sumTodayBtn: "오늘",
  sumNextDay: "내일 ›",
  sumRecorded24: "24시간 중 {dur} 기록 ({pct}%)",
  copySummary: "📋 요약 복사",
  weekLabel: "이번 주",
  monthLabel: "이번 달",
  prevWeek: "‹ 지난주",
  prevMonth: "‹ 지난달",
  nextWeek: "다음 주 ›",
  nextMonth: "다음 달 ›",
  sumRecordedElapsed: "경과한 {elapsed} 중 {dur} 기록 ({pct}%)",
  dailyAvg: "하루 평균 {dur}",
  thRank: "순위",
  thCat: "분류",
  thDur: "시간",
  thPct: "비율",
  unrecordedRow: "⚪ 기록 없음",
  heatTitle: "월간 히트맵",
  heatWeekdays: "월화수목금토일",
  heatDayDetail: "{date}: {dur} 기록",
  heatDayEmpty: "{date}: 기록 없음",
  copied: "클립보드에 복사했습니다 ✅",
  copyFailed: "복사 실패: ",
};

export const STRINGS: Record<Lang, typeof zh> = { zh, en, ja, ko };

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

const JA_MARKDOWN_STRINGS: MarkdownStrings = {
  headingTpl: "## 時間集計（{title}）",
  tableHeader: "| 順位 | 分類 | 時間 | 割合 | 活動 |",
  unrecordedLabel: "⚪ 未記録",
  totalLabel: "合計",
};

const KO_MARKDOWN_STRINGS: MarkdownStrings = {
  headingTpl: "## 시간 요약 ({title})",
  tableHeader: "| 순위 | 분류 | 시간 | 비율 | 활동 |",
  unrecordedLabel: "⚪ 기록 없음",
  totalLabel: "합계",
};

const MARKDOWN_STRINGS: Record<Lang, MarkdownStrings> = {
  zh: ZH_MARKDOWN_STRINGS,
  en: EN_MARKDOWN_STRINGS,
  ja: JA_MARKDOWN_STRINGS,
  ko: KO_MARKDOWN_STRINGS,
};

export function mdStrings(): MarkdownStrings {
  return MARKDOWN_STRINGS[getLang()];
}

const EN_REL_DAY_LABELS: RelDayLabels = {
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
};

const JA_REL_DAY_LABELS: RelDayLabels = {
  today: "今日",
  yesterday: "昨日",
  tomorrow: "明日",
};

const KO_REL_DAY_LABELS: RelDayLabels = {
  today: "오늘",
  yesterday: "어제",
  tomorrow: "내일",
};

const REL_DAY_LABELS_ALL: Record<Lang, RelDayLabels> = {
  zh: REL_DAY_LABELS,
  en: EN_REL_DAY_LABELS,
  ja: JA_REL_DAY_LABELS,
  ko: KO_REL_DAY_LABELS,
};

export function relDayLabels(): RelDayLabels {
  return REL_DAY_LABELS_ALL[getLang()];
}

const EN_SEGMENT_TIME_MESSAGES: SegmentTimeMessages = {
  startInvalid: "Invalid start time",
  endInvalid: "Invalid end time",
  endNotAfterStart: "End time must be after start time",
};

const JA_SEGMENT_TIME_MESSAGES: SegmentTimeMessages = {
  startInvalid: "開始時刻が無効です",
  endInvalid: "終了時刻が無効です",
  endNotAfterStart: "終了時刻は開始時刻より後にしてください",
};

const KO_SEGMENT_TIME_MESSAGES: SegmentTimeMessages = {
  startInvalid: "시작 시간이 올바르지 않습니다",
  endInvalid: "종료 시간이 올바르지 않습니다",
  endNotAfterStart: "종료 시간은 시작 시간보다 늦어야 합니다",
};

const SEGMENT_TIME_MESSAGES: Record<Lang, SegmentTimeMessages> = {
  zh: ZH_SEGMENT_TIME_MESSAGES,
  en: EN_SEGMENT_TIME_MESSAGES,
  ja: JA_SEGMENT_TIME_MESSAGES,
  ko: KO_SEGMENT_TIME_MESSAGES,
};

export function segmentTimeMessages(): SegmentTimeMessages {
  return SEGMENT_TIME_MESSAGES[getLang()];
}

const EN_CATEGORY_NAME_MESSAGES: CategoryNameMessages = {
  empty: "Category name cannot be empty",
  duplicate: "Category name already exists",
};

const JA_CATEGORY_NAME_MESSAGES: CategoryNameMessages = {
  empty: "カテゴリ名を入力してください",
  duplicate: "同じカテゴリ名がすでに存在します",
};

const KO_CATEGORY_NAME_MESSAGES: CategoryNameMessages = {
  empty: "분류 이름을 입력해 주세요",
  duplicate: "이미 존재하는 분류 이름입니다",
};

const CATEGORY_NAME_MESSAGES: Record<Lang, CategoryNameMessages> = {
  zh: ZH_CATEGORY_NAME_MESSAGES,
  en: EN_CATEGORY_NAME_MESSAGES,
  ja: JA_CATEGORY_NAME_MESSAGES,
  ko: KO_CATEGORY_NAME_MESSAGES,
};

export function categoryNameMessages(): CategoryNameMessages {
  return CATEGORY_NAME_MESSAGES[getLang()];
}
