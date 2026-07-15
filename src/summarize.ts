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

export interface MarkdownStrings {
  headingTpl: string; // 含 {title} 占位
  tableHeader: string;
  unrecordedLabel: string;
  totalLabel: string;
}

/** 默认（中文）Markdown 导出文案，也是 i18n zh 的单一来源。 */
export const ZH_MARKDOWN_STRINGS: MarkdownStrings = {
  headingTpl: "## 时间总结（{title}）",
  tableHeader: "| 排名 | 类别 | 时长 | 占比 | 包含活动 |",
  unrecordedLabel: "⚪ 未记录",
  totalLabel: "合计",
};

export function formatSummaryAsMarkdown(
  day: DayRecord,
  summary: DaySummary,
  _categories: Category[],
  s: MarkdownStrings = ZH_MARKDOWN_STRINGS,
): string {
  const lines: string[] = [];
  lines.push(s.headingTpl.replace("{title}", day.date));
  lines.push("");
  lines.push(s.tableHeader);
  lines.push("|---|---|---|---|---|");
  summary.byCategory.forEach((b, i) => {
    const acts = b.activities.join(" / ");
    lines.push(`| ${i + 1} | ${b.emoji} ${b.name} | **${formatDuration(b.minutes)}** | ${b.percent.toFixed(1)}% | ${acts} |`);
  });
  lines.push(`| - | ${s.unrecordedLabel} | ${formatDuration(summary.unrecordedMinutes)} | ${summary.unrecordedPercent.toFixed(1)}% | |`);
  lines.push(`| | **${s.totalLabel}** | **24h** | 100% | |`);
  return lines.join("\n");
}

export interface PeriodSummary {
  totalRecordedMinutes: number;
  denominatorMinutes: number;
  unrecordedMinutes: number;
  unrecordedPercent: number;
  byCategory: CategoryBucket[];
}

/**
 * 多日聚合。分母（已过去时间）由调用方算好传入。
 * 进行中段收口：今天→now，过去某天→"24:00"（忘关的段算到当天午夜）。
 */
export function summarizePeriod(
  days: DayRecord[],
  categories: Category[],
  opts: { today: string; now: string; denominatorMinutes: number },
): PeriodSummary {
  const minutesByCat = new Map<string, number>();
  const actsByCat = new Map<string, string[]>();

  for (const day of days) {
    for (const seg of day.segments) {
      const end = isOpenEnd(seg.end) ? (day.date === opts.today ? opts.now : "24:00") : seg.end;
      const mins = minutesDiff(seg.start, end);
      if (mins <= 0) continue;
      minutesByCat.set(seg.categoryId, (minutesByCat.get(seg.categoryId) ?? 0) + mins);
      const list = actsByCat.get(seg.categoryId) ?? [];
      if (!list.includes(seg.activity)) list.push(seg.activity);
      actsByCat.set(seg.categoryId, list);
    }
  }

  const denom = opts.denominatorMinutes;
  const buckets: CategoryBucket[] = [];
  for (const [catId, mins] of minutesByCat) {
    const cat = categories.find((c) => c.id === catId);
    buckets.push({
      categoryId: catId,
      emoji: cat?.emoji ?? "❓",
      name: cat?.name ?? catId,
      minutes: mins,
      percent: denom > 0 ? (mins / denom) * 100 : 0,
      activities: actsByCat.get(catId) ?? [],
    });
  }
  buckets.sort((a, b) => b.minutes - a.minutes);

  const totalRecorded = buckets.reduce((s, b) => s + b.minutes, 0);
  const unrecorded = Math.max(0, denom - totalRecorded);
  return {
    totalRecordedMinutes: totalRecorded,
    denominatorMinutes: denom,
    unrecordedMinutes: unrecorded,
    unrecordedPercent: denom > 0 ? (unrecorded / denom) * 100 : 0,
    byCategory: buckets,
  };
}

export function formatPeriodSummaryAsMarkdown(
  title: string,
  summary: PeriodSummary,
  s: MarkdownStrings = ZH_MARKDOWN_STRINGS,
): string {
  const lines: string[] = [];
  lines.push(s.headingTpl.replace("{title}", title));
  lines.push("");
  lines.push(s.tableHeader);
  lines.push("|---|---|---|---|---|");
  summary.byCategory.forEach((b, i) => {
    const acts = b.activities.join(" / ");
    lines.push(`| ${i + 1} | ${b.emoji} ${b.name} | **${formatDuration(b.minutes)}** | ${b.percent.toFixed(1)}% | ${acts} |`);
  });
  lines.push(`| - | ${s.unrecordedLabel} | ${formatDuration(summary.unrecordedMinutes)} | ${summary.unrecordedPercent.toFixed(1)}% | |`);
  lines.push(`| | **${s.totalLabel}** | **${formatDuration(summary.denominatorMinutes)}** | 100% | |`);
  return lines.join("\n");
}
