import { describe, it, expect } from "vitest";
import { summarizeDay, formatSummaryAsMarkdown, summarizePeriod, formatPeriodSummaryAsMarkdown } from "../src/summarize";
import { DayRecord, Segment } from "../src/types";
import { DEFAULT_CATEGORIES } from "../src/settings";

const makeSeg = (start: string, end: string, activity: string, categoryId: string, line = 0): Segment => ({
  start, end, activity, categoryId, lineNumber: line,
});

describe("summarizeDay", () => {
  it("groups segments by category and sums minutes", () => {
    const day: DayRecord = {
      date: "2026-6-17", filePath: "x.md",
      segments: [
        makeSeg("08:00", "09:00", "学习", "study"),
        makeSeg("09:00", "10:00", "看书", "study"),
        makeSeg("12:00", "12:30", "午饭", "meal"),
      ],
    };
    const result = summarizeDay(day, DEFAULT_CATEGORIES, "12:30");
    const study = result.byCategory.find(b => b.categoryId === "study");
    const meal = result.byCategory.find(b => b.categoryId === "meal");
    expect(study?.minutes).toBe(120);
    expect(meal?.minutes).toBe(30);
  });

  it("computes unrecorded as 24h - sum of recorded segments", () => {
    const day: DayRecord = {
      date: "2026-6-17", filePath: "x.md",
      segments: [makeSeg("08:00", "10:00", "学习", "study")],
    };
    const result = summarizeDay(day, DEFAULT_CATEGORIES, "23:59");
    expect(result.unrecordedMinutes).toBe(24 * 60 - 120);
  });

  it("sorts categories by minutes descending", () => {
    const day: DayRecord = {
      date: "2026-6-17", filePath: "x.md",
      segments: [
        makeSeg("00:00", "06:00", "睡觉", "sleep"),
        makeSeg("08:00", "09:00", "学习", "study"),
        makeSeg("12:00", "12:30", "午饭", "meal"),
      ],
    };
    const result = summarizeDay(day, DEFAULT_CATEGORIES, "23:59");
    expect(result.byCategory[0].categoryId).toBe("sleep");
    expect(result.byCategory[1].categoryId).toBe("study");
    expect(result.byCategory[2].categoryId).toBe("meal");
  });

  it("computes percentages summing to 100% (recorded + unrecorded)", () => {
    const day: DayRecord = {
      date: "2026-6-17", filePath: "x.md",
      segments: [makeSeg("00:00", "12:00", "睡觉", "sleep")],
    };
    const result = summarizeDay(day, DEFAULT_CATEGORIES, "23:59");
    const recorded = result.byCategory.reduce((s, b) => s + b.percent, 0);
    expect(recorded + result.unrecordedPercent).toBeCloseTo(100, 1);
  });

  it("excludes categories with zero minutes", () => {
    const day: DayRecord = {
      date: "2026-6-17", filePath: "x.md",
      segments: [makeSeg("08:00", "10:00", "学习", "study")],
    };
    const result = summarizeDay(day, DEFAULT_CATEGORIES, "10:00");
    expect(result.byCategory.length).toBe(1);
    expect(result.byCategory[0].categoryId).toBe("study");
  });

  it("treats an 'ing' open segment as ending at the provided 'now'", () => {
    const day: DayRecord = {
      date: "2026-6-17", filePath: "x.md",
      segments: [makeSeg("16:00", "ing", "学习", "study")],
    };
    const result = summarizeDay(day, DEFAULT_CATEGORIES, "17:30");
    const study = result.byCategory.find(b => b.categoryId === "study");
    expect(study?.minutes).toBe(90);
  });

  it("treats a legacy '00:00' open segment as ending at 'now' (backward compat)", () => {
    const day: DayRecord = {
      date: "2026-6-17", filePath: "x.md",
      segments: [makeSeg("16:00", "00:00", "学习", "study")],
    };
    const result = summarizeDay(day, DEFAULT_CATEGORIES, "17:30");
    const study = result.byCategory.find(b => b.categoryId === "study");
    expect(study?.minutes).toBe(90);
  });
});

describe("formatSummaryAsMarkdown", () => {
  it("formats summary as a Markdown table", () => {
    const day: DayRecord = {
      date: "2026-6-17", filePath: "x.md",
      segments: [makeSeg("08:00", "10:00", "学习", "study")],
    };
    const result = summarizeDay(day, DEFAULT_CATEGORIES, "10:00");
    const md = formatSummaryAsMarkdown(day, result, DEFAULT_CATEGORIES);
    expect(md).toContain("| 排名 | 类别 | 时长 | 占比 |");
    expect(md).toContain("📚 学习");
    expect(md).toContain("2h 0min");
  });
});

describe("summarizePeriod", () => {
  const cats = [
    { id: "work", emoji: "💼", name: "工作", aliases: [] },
    { id: "sleep", emoji: "😴", name: "睡眠", aliases: [] },
  ];
  const mkSeg = (start: string, end: string, activity: string, categoryId: string) =>
    ({ start, end, activity, categoryId, lineNumber: 1 });

  it("多日聚合同类累加 + 按分钟降序", () => {
    const days = [
      { date: "2026-6-29", filePath: "", segments: [mkSeg("08:00", "10:00", "写作", "work")] },
      { date: "2026-6-30", filePath: "", segments: [mkSeg("09:00", "12:00", "写作", "work")] },
    ];
    const r = summarizePeriod(days, cats, { today: "2026-7-1", now: "09:00", denominatorMinutes: 3 * 1440 });
    expect(r.byCategory[0].categoryId).toBe("work");
    expect(r.byCategory[0].minutes).toBe(300); // 120 + 180
    expect(r.totalRecordedMinutes).toBe(300);
    expect(r.denominatorMinutes).toBe(3 * 1440);
    expect(r.unrecordedMinutes).toBe(3 * 1440 - 300);
  });

  it("进行中段：今天收到 now、过去某天收到 24:00", () => {
    const days = [
      { date: "2026-6-30", filePath: "", segments: [mkSeg("22:00", "ing", "夜班", "work")] }, // 过去日 → 24:00 = 120min
      { date: "2026-7-1", filePath: "", segments: [mkSeg("08:00", "ing", "写作", "work")] }, // 今天 → now 09:00 = 60min
    ];
    const r = summarizePeriod(days, cats, { today: "2026-7-1", now: "09:00", denominatorMinutes: 10000 });
    expect(r.byCategory[0].minutes).toBe(180); // 120 + 60
  });

  it("空周期 → 全部未记录", () => {
    const r = summarizePeriod([], cats, { today: "2026-7-1", now: "09:00", denominatorMinutes: 1440 });
    expect(r.totalRecordedMinutes).toBe(0);
    expect(r.byCategory).toEqual([]);
    expect(r.unrecordedMinutes).toBe(1440);
    expect(r.unrecordedPercent).toBe(100);
  });

  it("分母为 0 → percent 不 NaN（防御）", () => {
    const days = [{ date: "2026-7-1", filePath: "", segments: [mkSeg("08:00", "09:00", "写作", "work")] }];
    const r = summarizePeriod(days, cats, { today: "2026-7-1", now: "09:00", denominatorMinutes: 0 });
    expect(r.byCategory[0].percent).toBe(0);
    expect(r.unrecordedPercent).toBe(0);
    expect(r.unrecordedMinutes).toBe(0);
  });
});

describe("formatPeriodSummaryAsMarkdown", () => {
  it("标题带周期范围 + 合计=分母", () => {
    const summary = {
      totalRecordedMinutes: 120,
      denominatorMinutes: 240,
      unrecordedMinutes: 120,
      unrecordedPercent: 50,
      byCategory: [
        { categoryId: "work", emoji: "💼", name: "工作", minutes: 120, percent: 50, activities: ["写作"] },
      ],
    };
    const md = formatPeriodSummaryAsMarkdown("本周 2026-6-29 ~ 2026-7-5", summary);
    expect(md).toContain("## 时间总结（本周 2026-6-29 ~ 2026-7-5）");
    expect(md).toContain("💼 工作");
    expect(md).toContain("⚪ 未记录");
    expect(md).toContain("**合计**");
  });
});
