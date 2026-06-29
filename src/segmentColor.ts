import { Category } from "./types";

export interface CategoryColor {
  bg: string; // 淡色填充
  border: string; // 较浓描边
  accent: string; // 实色强调（左条 / 圆点）
}

// 手挑的 12 个色相，均匀且避开浑浊色；深/浅主题下都清晰可分
const PALETTE_HUES = [210, 145, 35, 280, 0, 190, 95, 320, 50, 260, 170, 15];
const SAT = 65;
const LIGHT = 55;

/**
 * 分类颜色的唯一来源。按分类在 categories 中的下标取色相，循环复用。
 * other / 未知 / 找不到 → null（由调用方各自用中性样式）。
 */
export function segmentColor(
  categoryId: string,
  categories: Category[],
): CategoryColor | null {
  if (categoryId === "other") return null;
  const index = categories.findIndex((c) => c.id === categoryId);
  if (index < 0) return null;
  const hue = PALETTE_HUES[index % PALETTE_HUES.length];
  return {
    bg: `hsla(${hue}, ${SAT}%, ${LIGHT}%, 0.15)`,
    border: `hsla(${hue}, ${SAT}%, ${LIGHT}%, 0.55)`,
    accent: `hsl(${hue}, ${SAT}%, ${LIGHT}%)`,
  };
}
