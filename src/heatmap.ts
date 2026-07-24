/**
 * 月历热力图（纯逻辑，无 Obsidian 依赖）。
 * 「某天是否有记录」按解析后的总分钟判定，绝不按文件是否存在——
 * 插件启动会自动创建当天空文件，空文件 = 0 分钟 = 0 档。
 * 日期语义与数据层一致（记录文件名的本地日期），不引入任何时区处理。
 */
import { DayRecord } from "./types";
import { minutesDiff, isOpenEnd } from "./time";
import { parseDateString } from "./date";

/** 单日已记录分钟。口径与周期汇总一致：进行中段今天算到 now、其余日算到 24:00。 */
export function dayRecordedMinutes(day: DayRecord, today: string, now: string): number {
  const effNow = day.date === today ? now : "24:00";
  let total = 0;
  for (const seg of day.segments) {
    const end = isOpenEnd(seg.end) ? effNow : seg.end;
    const mins = minutesDiff(seg.start, end);
    if (mins > 0) total += mins;
  }
  return total;
}

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/** 分钟 → 档位：0 无记录；1 <2h；2 2–6h；3 6–12h；4 12h+。 */
export function heatLevel(minutes: number): HeatLevel {
  if (minutes <= 0) return 0;
  if (minutes < 120) return 1;
  if (minutes < 360) return 2;
  if (minutes < 720) return 3;
  return 4;
}

export interface HeatCell {
  /** null = 月历首尾的对齐空位 */
  date: string | null;
  minutes: number;
  level: HeatLevel;
  isToday: boolean;
  isFuture: boolean;
}

const BLANK: HeatCell = { date: null, minutes: 0, level: 0, isToday: false, isFuture: false };

/**
 * 整月 DayRecord（按日连续）→ 周一起始的月历网格（每行 7 格，首尾补空位）。
 * 周起始与 weekRange 的口径一致（周一）。
 */
export function buildMonthHeatmap(days: DayRecord[], today: string, now: string): HeatCell[][] {
  if (days.length === 0) return [];
  const first = parseDateString(days[0].date);
  const todayD = parseDateString(today);
  if (!first) return [];

  const cells: HeatCell[] = [];
  const leading = (first.getDay() + 6) % 7; // 0=周一
  for (let i = 0; i < leading; i++) cells.push({ ...BLANK });

  for (const day of days) {
    const minutes = dayRecordedMinutes(day, today, now);
    const d = parseDateString(day.date);
    cells.push({
      date: day.date,
      minutes,
      level: heatLevel(minutes),
      isToday: day.date === today,
      isFuture: !!(d && todayD && d.getTime() > todayD.getTime()),
    });
  }

  while (cells.length % 7 !== 0) cells.push({ ...BLANK });

  const weeks: HeatCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
