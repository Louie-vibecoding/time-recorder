import { Category, TimeRecorderSettings } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "sleep",   name: "睡眠",     emoji: "😴", aliases: ["睡觉", "午睡"] },
  { id: "study",   name: "学习",     emoji: "📚", aliases: ["阅读", "听课", "复习"] },
  { id: "meal",    name: "饮食",     emoji: "🍱", aliases: ["吃饭", "早饭", "午饭", "晚饭", "吃早", "吃午", "吃晚", "外卖"] },
  { id: "hygiene", name: "个人卫生", emoji: "🚿", aliases: ["洗漱", "上厕所", "洗澡", "刷牙"] },
  { id: "commute", name: "通勤",     emoji: "🚗", aliases: ["地铁", "公交", "打车"] },
  { id: "social",  name: "社交",     emoji: "💬", aliases: ["微信", "聊天", "电话", "朋友"] },
  { id: "chores",  name: "家务",     emoji: "🧹", aliases: ["整理", "打扫", "洗衣"] },
  { id: "work",    name: "工作",     emoji: "💼", aliases: ["上班", "开会", "加班"] },
  { id: "sport",   name: "运动",     emoji: "🏃", aliases: ["跑步", "健身", "锻炼"] },
  { id: "fun",     name: "娱乐",     emoji: "🎮", aliases: ["游戏", "刷手机", "看剧", "视频"] },
];

export const OTHER_CATEGORY: Category = {
  id: "other",
  name: "其他",
  emoji: "❓",
  aliases: [],
};

export const DEFAULT_SETTINGS: TimeRecorderSettings = {
  version: 1,
  recordsFolder: "反省日志/时间记录",
  templatePath: "反省日志/时间记录/timer template.md",
  flashNotePath: "",
  categories: DEFAULT_CATEGORIES,
};

/**
 * 英文默认分类：id 与中文默认一一对应（颜色映射 / 已有记录的归类保持稳定），
 * 仅名称与关键词本地化。只影响「全新安装且界面为英文」的首次初始化。
 */
export const DEFAULT_CATEGORIES_EN: Category[] = [
  { id: "sleep",   name: "Sleep",    emoji: "😴", aliases: ["nap"] },
  { id: "study",   name: "Study",    emoji: "📚", aliases: ["reading", "class", "review"] },
  { id: "meal",    name: "Meals",    emoji: "🍱", aliases: ["breakfast", "lunch", "dinner", "eat", "food", "takeout"] },
  { id: "hygiene", name: "Hygiene",  emoji: "🚿", aliases: ["shower", "wash", "toilet", "teeth"] },
  { id: "commute", name: "Commute",  emoji: "🚗", aliases: ["subway", "bus", "taxi", "drive"] },
  { id: "social",  name: "Social",   emoji: "💬", aliases: ["chat", "call", "phone", "friends"] },
  { id: "chores",  name: "Chores",   emoji: "🧹", aliases: ["cleaning", "laundry", "tidy"] },
  { id: "work",    name: "Work",     emoji: "💼", aliases: ["meeting", "overtime", "office"] },
  { id: "sport",   name: "Exercise", emoji: "🏃", aliases: ["run", "gym", "workout"] },
  { id: "fun",     name: "Fun",      emoji: "🎮", aliases: ["game", "gaming", "video", "tv"] },
];

/** 按语言取默认分类（深拷贝，调用方可安全修改）。 */
export function defaultCategoriesFor(lang: "zh" | "en"): Category[] {
  const src = lang === "zh" ? DEFAULT_CATEGORIES : DEFAULT_CATEGORIES_EN;
  return src.map((c) => ({ ...c, aliases: [...c.aliases] }));
}

/**
 * 「恢复默认分类」专用：目标语言默认之上，把另一语言的名称+关键词并入 aliases
 * （忽略大小写去重）。这样切换界面语言后点恢复，历史记录里旧语言写下的活动名
 * （如「睡眠」「吃饭」）仍能正确归类，不会掉进 Other。
 * 全新安装（defaultSettingsFor）不带桥接，保持关键词列表干净。
 */
export function defaultCategoriesForRestore(lang: "zh" | "en"): Category[] {
  const base = defaultCategoriesFor(lang);
  const twin = lang === "zh" ? DEFAULT_CATEGORIES_EN : DEFAULT_CATEGORIES;
  for (const c of base) {
    const tw = twin.find((o) => o.id === c.id);
    if (!tw) continue;
    for (const cand of [tw.name, ...tw.aliases]) {
      if (!c.aliases.some((a) => a.trim().toLowerCase() === cand.trim().toLowerCase())) {
        c.aliases.push(cand);
      }
    }
  }
  return base;
}

/**
 * 按语言取整套默认设置（深拷贝）。
 * 注意：记录文件名格式（"YYYY-M-D 时间记录.md"）是数据层约定，所有语言统一，
 * 不在此处本地化——否则切换界面语言会导致旧记录文件读不到。
 */
export function defaultSettingsFor(lang: "zh" | "en"): TimeRecorderSettings {
  if (lang === "zh") {
    return { ...DEFAULT_SETTINGS, categories: defaultCategoriesFor("zh") };
  }
  return {
    version: DEFAULT_SETTINGS.version,
    recordsFolder: "Time Records",
    templatePath: "Time Records/timer template.md",
    flashNotePath: "",
    categories: defaultCategoriesFor("en"),
  };
}
