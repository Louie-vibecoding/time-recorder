/**
 * 周/月时期范围与「已过去时间」计算（纯逻辑，无 Obsidian 依赖，便于测试）。
 * 日期串格式 = "YYYY-M-D"（与 date.ts 一致，无补零）。
 */
import { parseDateString, addDays } from "./date";
import { parseHHMM } from "./time";

/** 本周范围（周一→周日）。 */
export function weekRange(date: string): { start: string; end: string } {
  const d = parseDateString(date);
  if (!d) return { start: date, end: date };
  const offset = (d.getDay() + 6) % 7; // getDay: 0=Sun..6=Sat → 距本周一天数
  const start = addDays(date, -offset);
  return { start, end: addDays(start, 6) };
}

/** 本月范围（1 号→月末）。 */
export function monthRange(date: string): { start: string; end: string } {
  const d = parseDateString(date);
  if (!d) return { start: date, end: date };
  const y = d.getFullYear();
  const mo = d.getMonth(); // 0-based
  const lastDay = new Date(y, mo + 1, 0).getDate();
  return { start: `${y}-${mo + 1}-1`, end: `${y}-${mo + 1}-${lastDay}` };
}

/** 含首尾的日期串数组（start > end 或非法 → 空数组）。 */
export function enumerateDates(start: string, end: string): string[] {
  const s = parseDateString(start);
  const e = parseDateString(end);
  if (!s || !e || s.getTime() > e.getTime()) return [];
  const out: string[] = [];
  let cur = start;
  let curD = parseDateString(cur)!;
  while (curD.getTime() <= e.getTime()) {
    out.push(cur);
    cur = addDays(cur, 1);
    curD = parseDateString(cur)!;
  }
  return out;
}

export interface PeriodElapsed {
  elapsedMinutes: number;
  elapsedDays: number;
}

/**
 * 周期内「已过去」的分钟数与天数。
 * - 过去周期（today > end）→ 整段。
 * - 未来周期（today < start）→ 0。
 * - 含今天 → 之前整天 ×1440 + 今日已过分钟（parseHHMM(now)）。
 */
export function elapsedInPeriod(
  start: string,
  end: string,
  today: string,
  now: string,
): PeriodElapsed {
  const numDays = enumerateDates(start, end).length;
  const s = parseDateString(start);
  const e = parseDateString(end);
  const t = parseDateString(today);
  if (!s || !e || !t) return { elapsedMinutes: 0, elapsedDays: 0 };
  if (t.getTime() > e.getTime()) return { elapsedMinutes: numDays * 1440, elapsedDays: numDays };
  if (t.getTime() < s.getTime()) return { elapsedMinutes: 0, elapsedDays: 0 };
  const daysBeforeToday = Math.round((t.getTime() - s.getTime()) / 86400000);
  const mins = parseHHMM(now);
  const todayMins = isNaN(mins) ? 0 : mins;
  return { elapsedMinutes: daysBeforeToday * 1440 + todayMins, elapsedDays: daysBeforeToday + 1 };
}
