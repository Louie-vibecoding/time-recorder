import { Category, TimeRecorderSettings } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "sleep",   name: "睡眠",     emoji: "😴" },
  { id: "study",   name: "学习",     emoji: "📚" },
  { id: "meal",    name: "饮食",     emoji: "🍱" },
  { id: "hygiene", name: "个人卫生", emoji: "🚿" },
  { id: "commute", name: "通勤",     emoji: "🚗" },
  { id: "yuke",    name: "陪伴",     emoji: "👧" },
  { id: "social",  name: "社交",     emoji: "💬" },
  { id: "chores",  name: "家务",     emoji: "🧹" },
  { id: "work",    name: "工作",     emoji: "💼" },
  { id: "sport",   name: "运动",     emoji: "🏃" },
  { id: "fun",     name: "娱乐",     emoji: "🎮" },
];

export const OTHER_CATEGORY: Category = {
  id: "other",
  name: "其他",
  emoji: "❓",
};

export const DEFAULT_SETTINGS: TimeRecorderSettings = {
  version: 1,
  recordsFolder: "反省日志/时间记录",
  templatePath: "反省日志/时间记录/timer template.md",
  categories: DEFAULT_CATEGORIES,
};
