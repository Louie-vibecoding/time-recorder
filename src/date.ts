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
