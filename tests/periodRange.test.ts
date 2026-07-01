import { describe, it, expect } from "vitest";
import { weekRange, monthRange, enumerateDates, elapsedInPeriod } from "../src/periodRange";

describe("weekRange（周一→周日）", () => {
  it("周三 → 本周一到周日", () => {
    // 2026-7-1 是周三
    expect(weekRange("2026-7-1")).toEqual({ start: "2026-6-29", end: "2026-7-5" });
  });
  it("周一当天 → 自身为起", () => {
    expect(weekRange("2026-6-29")).toEqual({ start: "2026-6-29", end: "2026-7-5" });
  });
  it("周日当天 → 归入本周（该周一起）", () => {
    expect(weekRange("2026-7-5")).toEqual({ start: "2026-6-29", end: "2026-7-5" });
  });
});

describe("monthRange", () => {
  it("月中 → 当月 1 号到月末", () => {
    expect(monthRange("2026-7-15")).toEqual({ start: "2026-7-1", end: "2026-7-31" });
  });
  it("2 月非闰年 → 28 天", () => {
    expect(monthRange("2025-2-10")).toEqual({ start: "2025-2-1", end: "2025-2-28" });
  });
  it("2 月闰年 → 29 天", () => {
    expect(monthRange("2024-2-10")).toEqual({ start: "2024-2-1", end: "2024-2-29" });
  });
});

describe("enumerateDates（含首尾）", () => {
  it("一周 = 7 天顺序", () => {
    expect(enumerateDates("2026-6-29", "2026-7-5")).toEqual([
      "2026-6-29", "2026-6-30", "2026-7-1", "2026-7-2", "2026-7-3", "2026-7-4", "2026-7-5",
    ]);
  });
  it("单日 = 只含自身", () => {
    expect(enumerateDates("2026-7-1", "2026-7-1")).toEqual(["2026-7-1"]);
  });
  it("start > end → 空数组", () => {
    expect(enumerateDates("2026-7-5", "2026-7-1")).toEqual([]);
  });
});

describe("elapsedInPeriod（已过去分钟 + 天数）", () => {
  it("过去周期 → 整段（天数×1440）", () => {
    expect(elapsedInPeriod("2026-6-29", "2026-7-5", "2026-7-10", "09:00")).toEqual({
      elapsedMinutes: 7 * 1440, elapsedDays: 7,
    });
  });
  it("未来周期 → 0", () => {
    expect(elapsedInPeriod("2026-7-6", "2026-7-12", "2026-7-1", "09:00")).toEqual({
      elapsedMinutes: 0, elapsedDays: 0,
    });
  });
  it("含今天 → 之前整天 + 今日已过分钟", () => {
    // 今天 2026-7-1（周三，周内第 3 天），now=09:00=540
    expect(elapsedInPeriod("2026-6-29", "2026-7-5", "2026-7-1", "09:00")).toEqual({
      elapsedMinutes: 2 * 1440 + 540, elapsedDays: 3,
    });
  });
  it("今天=周期首日 + now=00:00 → 0 分钟 / 1 天", () => {
    expect(elapsedInPeriod("2026-6-29", "2026-7-5", "2026-6-29", "00:00")).toEqual({
      elapsedMinutes: 0, elapsedDays: 1,
    });
  });
});
