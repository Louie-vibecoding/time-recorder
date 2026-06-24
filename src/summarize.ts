import { DayRecord, Category } from "./types";
import { formatDuration, minutesDiff, isOpenEnd } from "./time";

export interface CategoryBucket {
  categoryId: string;
  emoji: string;
  name: string;
  minutes: number;
  percent: number;
  activities: string[];
}

export interface DaySummary {
  date: string;
  totalRecordedMinutes: number;
  unrecordedMinutes: number;
  unrecordedPercent: number;
  byCategory: CategoryBucket[];
}

const DAY_TOTAL_MINUTES = 24 * 60;

export function summarizeDay(day: DayRecord, categories: Category[], now: string): DaySummary {
  const minutesByCat = new Map<string, number>();
  const actsByCat = new Map<string, string[]>();

  for (const seg of day.segments) {
    const end = isOpenEnd(seg.end) ? now : seg.end;
    const mins = minutesDiff(seg.start, end);
    if (mins <= 0) continue;
    minutesByCat.set(seg.categoryId, (minutesByCat.get(seg.categoryId) ?? 0) + mins);
    const list = actsByCat.get(seg.categoryId) ?? [];
    if (!list.includes(seg.activity)) list.push(seg.activity);
    actsByCat.set(seg.categoryId, list);
  }

  const buckets: CategoryBucket[] = [];
  for (const [catId, mins] of minutesByCat) {
    const cat = categories.find(c => c.id === catId);
    buckets.push({
      categoryId: catId,
      emoji: cat?.emoji ?? "❓",
      name: cat?.name ?? catId,
      minutes: mins,
      percent: (mins / DAY_TOTAL_MINUTES) * 100,
      activities: actsByCat.get(catId) ?? [],
    });
  }
  buckets.sort((a, b) => b.minutes - a.minutes);

  const totalRecorded = buckets.reduce((s, b) => s + b.minutes, 0);
  const unrecorded = Math.max(0, DAY_TOTAL_MINUTES - totalRecorded);

  return {
    date: day.date,
    totalRecordedMinutes: totalRecorded,
    unrecordedMinutes: unrecorded,
    unrecordedPercent: (unrecorded / DAY_TOTAL_MINUTES) * 100,
    byCategory: buckets,
  };
}

export function formatSummaryAsMarkdown(day: DayRecord, summary: DaySummary, _categories: Category[]): string {
  const lines: string[] = [];
  lines.push(`## 时间总结（${day.date}）`);
  lines.push("");
  lines.push("| 排名 | 类别 | 时长 | 占比 | 包含活动 |");
  lines.push("|---|---|---|---|---|");
  summary.byCategory.forEach((b, i) => {
    const acts = b.activities.join(" / ");
    lines.push(`| ${i + 1} | ${b.emoji} ${b.name} | **${formatDuration(b.minutes)}** | ${b.percent.toFixed(1)}% | ${acts} |`);
  });
  lines.push(`| - | ⚪ 未记录 | ${formatDuration(summary.unrecordedMinutes)} | ${summary.unrecordedPercent.toFixed(1)}% | |`);
  lines.push("| | **合计** | **24h** | 100% | |");
  return lines.join("\n");
}
