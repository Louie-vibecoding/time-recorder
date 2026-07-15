import { Category } from "./types";

/** 把逗号分隔（半/全角）的关键词串解析成去空白、去空项、去重（忽略大小写、保留首次形态）的数组。 */
export function parseAliases(input: string): string[] {
  const parts = input
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export interface CategoryNameMessages {
  empty: string;
  duplicate: string;
}

/** 默认（中文）校验文案，也是 i18n zh 的单一来源。 */
export const ZH_CATEGORY_NAME_MESSAGES: CategoryNameMessages = {
  empty: "分类名不能为空",
  duplicate: "分类名已存在",
};

/**
 * 校验分类名。合法返回 null，非法返回错误消息（文案可注入，默认中文）。
 * - 非空（trim 后）
 * - 不与其它分类重名（忽略大小写；selfIndex 处的同名视为合法 = 没改名）
 */
export function validateCategoryName(
  name: string,
  categories: Category[],
  selfIndex: number,
  msgs: CategoryNameMessages = ZH_CATEGORY_NAME_MESSAGES,
): string | null {
  const n = name.trim().toLowerCase();
  if (n === "") return msgs.empty;
  for (let i = 0; i < categories.length; i++) {
    if (i === selfIndex) continue;
    if (categories[i].name.trim().toLowerCase() === n) return msgs.duplicate;
  }
  return null;
}
