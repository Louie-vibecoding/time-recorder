import { Category } from "./types";

/**
 * Alias keywords per category id. Activity name containing any of these → matches.
 * Derived from the 2026-5-12 manual analysis. Editable in 1.1+.
 */
const ALIAS_MAP: Record<string, string[]> = {
  sleep:   ["睡觉", "午睡", "睡眠"],
  study:   ["学习", "阅读", "听课", "复习", "obsidian", "股市"],
  meal:    ["吃饭", "早饭", "午饭", "晚饭", "吃饭", "吃晚", "吃早", "吃午", "外卖"],
  hygiene: ["洗漱", "上厕所", "洗澡", "刷牙"],
  commute: ["通勤", "地铁", "公交", "打车"],
  yuke:    ["雨珂"],
  social:  ["微信", "聊天", "电话", "社交", "朋友"],
  chores:  ["整理", "打扫", "家务", "洗衣"],
};

export function inferCategoryId(activity: string, categories: Category[]): string {
  const a = activity.trim().toLowerCase();
  if (a === "") return "other";

  // 1. Exact match by category name
  for (const c of categories) {
    if (a === c.name.toLowerCase()) return c.id;
  }

  // 2. Substring match — activity contains category name
  for (const c of categories) {
    if (a.includes(c.name.toLowerCase())) return c.id;
  }

  // 3. Alias map
  for (const c of categories) {
    const aliases = ALIAS_MAP[c.id] || [];
    for (const alias of aliases) {
      if (a.includes(alias.toLowerCase())) return c.id;
    }
  }

  return "other";
}
