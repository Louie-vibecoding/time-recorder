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
  categories: DEFAULT_CATEGORIES,
};
