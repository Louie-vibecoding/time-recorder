import { describe, it, expect, vi } from "vitest";
import {
  getTodayDateString,
  getDateFilename,
  addDays,
  parseDateString,
  dayViewEffectiveNow,
  relativeDayLabel,
} from "../src/date";

describe("getTodayDateString", () => {
  it("returns YYYY-M-D (no zero-pad)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 7)); // June is month 5
    expect(getTodayDateString()).toBe("2026-6-7");
    vi.setSystemTime(new Date(2026, 11, 25));
    expect(getTodayDateString()).toBe("2026-12-25");
    vi.useRealTimers();
  });
});

describe("getDateFilename", () => {
  it("formats as {date} 时间记录.md", () => {
    expect(getDateFilename("2026-6-7")).toBe("2026-6-7 时间记录.md");
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    expect(addDays("2026-6-7", 1)).toBe("2026-6-8");
    expect(addDays("2026-6-30", 1)).toBe("2026-7-1");
    expect(addDays("2026-12-31", 1)).toBe("2027-1-1");
  });

  it("subtracts days", () => {
    expect(addDays("2026-6-1", -1)).toBe("2026-5-31");
  });
});

describe("parseDateString", () => {
  it("parses YYYY-M-D into a Date", () => {
    const d = parseDateString("2026-6-7");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // 0-indexed
    expect(d.getDate()).toBe(7);
  });

  it("returns null on bad input", () => {
    expect(parseDateString("bad")).toBeNull();
  });
});

describe("dayViewEffectiveNow", () => {
  it("returns now when anchor is today", () => {
    expect(dayViewEffectiveNow("2026-7-6", "2026-7-6", "14:30")).toBe("14:30");
  });

  it("returns 24:00 for a past day (忘关的进行中段算到午夜)", () => {
    expect(dayViewEffectiveNow("2026-7-5", "2026-7-6", "14:30")).toBe("24:00");
  });

  it("returns 24:00 for a future day", () => {
    expect(dayViewEffectiveNow("2026-7-7", "2026-7-6", "14:30")).toBe("24:00");
  });
});

describe("relativeDayLabel", () => {
  it("labels today", () => {
    expect(relativeDayLabel("2026-7-6", "2026-7-6")).toBe("今天");
  });

  it("labels yesterday", () => {
    expect(relativeDayLabel("2026-7-5", "2026-7-6")).toBe("昨天");
  });

  it("labels tomorrow", () => {
    expect(relativeDayLabel("2026-7-7", "2026-7-6")).toBe("明天");
  });

  it("returns empty string for other days", () => {
    expect(relativeDayLabel("2026-7-1", "2026-7-6")).toBe("");
    expect(relativeDayLabel("2026-7-10", "2026-7-6")).toBe("");
  });

  it("handles month boundary for yesterday/tomorrow", () => {
    expect(relativeDayLabel("2026-6-30", "2026-7-1")).toBe("昨天");
    expect(relativeDayLabel("2026-8-1", "2026-7-31")).toBe("明天");
  });
});
