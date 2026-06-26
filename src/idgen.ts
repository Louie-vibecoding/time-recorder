/**
 * 由分类名生成一个非空、唯一、不等于 "other" 的内部 id。
 * - slug：小写、ascii 字母数字以外的连续字符压成 "-"，去首尾 "-"
 * - 无 ascii 字母数字（如纯中文名）→ 回落 "cat"
 * - 冲突（撞 existingIds 或保留字 "other"）→ 追加 "-2"/"-3"... 直到唯一
 */
export function generateCategoryId(name: string, existingIds: string[]): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = slug || "cat";
  const taken = new Set([...existingIds, "other"]);

  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
