import { describe, it, expect } from "vitest";
import { dayRecordedMinutes, heatLevel, buildMonthHeatmap, HeatCell } from "../src/heatmap";
import { DayRecord, Segment } from "../src/types";

function seg(start: string, end: string, activity = "x"): Segment {
  return { start, end, activity, categoryId: "study", lineNumber: 0 };
}

function day(date: string, segments: Segment[] = []): DayRecord {
  return { date, filePath: `${date} 时间记录.md`, segments };
}

describe("dayRecordedMinutes（口径与周期汇总一致）", () => {
  it("普通段求和", () => {
    const d = day("2024-1-10", [seg("08:00", "09:30"), seg("10:00", "10:45")]);
    expect(dayRecordedMinutes(d, "2024-1-20", "12:00")).toBe(90 + 45);
  });

  it("进行中段：当天算到 now，过去日算到 24:00", () => {
    const ing = day("2024-1-10", [seg("23:00", "ing")]);
    expect(dayRecordedMinutes(ing, "2024-1-10", "23:30")).toBe(30);
    expect(dayRecordedMinutes(ing, "2024-1-20", "12:00")).toBe(60);
  });

  it("空文件（启动自动创建）= 0 分钟，不算有记录", () => {
    expect(dayRecordedMinutes(day("2024-1-10"), "2024-1-20", "12:00")).toBe(0);
  });

  it("无效段（负时长）跳过", () => {
    const d = day("2024-1-10", [seg("10:00", "09:00"), seg("11:00", "11:30")]);
    expect(dayRecordedMinutes(d, "2024-1-20", "12:00")).toBe(30);
  });
});

describe("heatLevel 分档（0 / <2h / 2-6h / 6-12h / 12h+）", () => {
  it("边界值", () => {
    expect(heatLevel(0)).toBe(0);
    expect(heatLevel(1)).toBe(1);
    expect(heatLevel(119)).toBe(1);
    expect(heatLevel(120)).toBe(2);
    expect(heatLevel(359)).toBe(2);
    expect(heatLevel(360)).toBe(3);
    expect(heatLevel(719)).toBe(3);
    expect(heatLevel(720)).toBe(4);
    expect(heatLevel(1440)).toBe(4);
  });
});

describe("buildMonthHeatmap（周一起始月历）", () => {
  // 2024-01-01 是周一：31 天，无前导空位，最后一行补 4 个空位，共 5 行
  const jan = Array.from({ length: 31 }, (_, i) => day(`2024-1-${i + 1}`));

  it("2024-01：5 行 × 7 列，首格即 1 号，末行 4 空位", () => {
    const weeks = buildMonthHeatmap(jan, "2024-1-15", "12:00");
    expect(weeks).toHaveLength(5);
    for (const w of weeks) expect(w).toHaveLength(7);
    expect(weeks[0][0].date).toBe("2024-1-1");
    expect(weeks[4][2].date).toBe("2024-1-31");
    expect(weeks[4].slice(3).every((c: HeatCell) => c.date === null)).toBe(true);
  });

  it("2024-02（闰年，2-1 是周四）：前导 3 空位，29 天", () => {
    const feb = Array.from({ length: 29 }, (_, i) => day(`2024-2-${i + 1}`));
    const weeks = buildMonthHeatmap(feb, "2024-3-1", "12:00");
    expect(weeks[0].slice(0, 3).every((c: HeatCell) => c.date === null)).toBe(true);
    expect(weeks[0][3].date).toBe("2024-2-1");
    const flat = weeks.flat().filter((c: HeatCell) => c.date !== null);
    expect(flat).toHaveLength(29);
    expect(flat[28].date).toBe("2024-2-29");
  });

  it("isToday / isFuture 标记正确（未来日淡化、今日高亮）", () => {
    const weeks = buildMonthHeatmap(jan, "2024-1-15", "12:00");
    const flat = weeks.flat().filter((c: HeatCell) => c.date !== null);
    expect(flat[14].isToday).toBe(true);
    expect(flat[13].isToday).toBe(false);
    expect(flat[13].isFuture).toBe(false);
    expect(flat[15].isFuture).toBe(true);
    expect(flat[30].isFuture).toBe(true);
  });

  it("有记录的天分钟与档位正确，其余为 0 档", () => {
    const withRec = jan.map((d, i) =>
      i === 4 ? day(d.date, [seg("08:00", "12:00")]) : d,
    );
    const weeks = buildMonthHeatmap(withRec, "2024-1-15", "12:00");
    const flat = weeks.flat().filter((c: HeatCell) => c.date !== null);
    expect(flat[4].minutes).toBe(240);
    expect(flat[4].level).toBe(2);
    expect(flat[5].minutes).toBe(0);
    expect(flat[5].level).toBe(0);
  });
});
