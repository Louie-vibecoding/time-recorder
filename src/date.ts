/** Returns "YYYY-M-D" (no zero-padding) for today's local date. */
export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** "2026-6-7" → "2026-6-7 时间记录.md" */
export function getDateFilename(dateString: string): string {
  return `${dateString} 时间记录.md`;
}

/** "2026-6-7" + 1 → "2026-6-8" */
export function addDays(dateString: string, delta: number): string {
  const d = parseDateString(dateString);
  if (!d) return dateString;
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Parse "YYYY-M-D" to a Date. Returns null on malformed input. */
export function parseDateString(dateString: string): Date | null {
  const m = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(d, 10));
}

/**
 * 日视图「进行中段」收口用的 now：
 * 看今天 → 传入的 now（算到此刻）；看其它日期 → "24:00"（忘关的段算到当天午夜，
 * 与 summarizePeriod 对过去日的口径一致）。
 */
export function dayViewEffectiveNow(anchor: string, today: string, now: string): string {
  return anchor === today ? now : "24:00";
}

export interface RelDayLabels {
  today: string;
  yesterday: string;
  tomorrow: string;
}

/** 默认（中文）相对日标签，也是 i18n zh 的单一来源。 */
export const REL_DAY_LABELS: RelDayLabels = {
  today: "今天",
  yesterday: "昨天",
  tomorrow: "明天",
};

/** 相对日标签：今天 / 昨天 / 明天 / ""（其余日期）。文案可注入（i18n）。 */
export function relativeDayLabel(
  anchor: string,
  today: string,
  labels: RelDayLabels = REL_DAY_LABELS,
): string {
  if (anchor === today) return labels.today;
  if (anchor === addDays(today, -1)) return labels.yesterday;
  if (anchor === addDays(today, 1)) return labels.tomorrow;
  return "";
}
