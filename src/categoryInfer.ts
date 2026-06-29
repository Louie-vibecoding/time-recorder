import { Category } from "./types";

/**
 * 按活动名推断 categoryId。匹配顺序：
 *   1. 活动名 == 分类名（精确，忽略大小写）
 *   2. 活动名包含分类名（子串）
 *   3. 活动名包含该分类任一 alias 关键词（子串）
 *   4. 都不中 → "other"
 * 关键词来源是 category.aliases（用户可在设置里编辑）。
 * categoryId 不写进 .md（决策 #5），每次按活动名现推断，故分类增删改不触碰历史记录。
 */
export function inferCategoryId(activity: string, categories: Category[]): string {
  const a = activity.trim().toLowerCase();
  if (a === "") return "other";

  // 1. Exact match by category name
  for (const c of categories) {
    if (c.name && a === c.name.toLowerCase()) return c.id;
  }

  // 2. Substring match — activity contains category name
  for (const c of categories) {
    if (c.name && a.includes(c.name.toLowerCase())) return c.id;
  }

  // 3. Per-category alias keywords
  for (const c of categories) {
    const aliases = c.aliases ?? [];
    for (const alias of aliases) {
      const key = alias.trim().toLowerCase();
      if (key && a.includes(key)) return c.id;
    }
  }

  return "other";
}
