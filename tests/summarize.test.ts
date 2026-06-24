import { describe, it, expect } from "vitest";
import { summarizeDay, formatSummaryAsMarkdown } from "../src/summarize";
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
