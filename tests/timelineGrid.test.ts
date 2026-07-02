import { describe, it, expect } from "vitest";
import {
  snapStartToHalfHour,
  halfHourGridTicks,
  isShortSegment,
  SHORT_SEGMENT_THRESHOLD_PX,
  emptySlotFill,
} from "../src/timelineGrid";

describe("snapStartToHalfHour", () => {
  it("整点保持不动", () => {
    expect(snapStartToHalfHour(0)).toBe(0);
    expect(snapStartToHalfHour(480)).toBe(480); // 08:00
  });

  it("半点保持不动", () => {
    expect(snapStartToHalfHour(510)).toBe(510); // 08:30
  });

  it("四舍五入到最近半小时", () => {
    expect(snapStartToHalfHour(500)).toBe(510); // 8:20 → 8:30
    expect(snapStartToHalfHour(494)).toBe(480); // 8:14 → 8:00
    expect(snapStartToHalfHour(495)).toBe(510); // 8:15 → 8:30（.5 向上）
  });

  it("下限 0（负数夹到 0）", () => {
    expect(snapStartToHalfHour(-20)).toBe(0);
  });

  it("上限 23:30（封顶，避免落到 24:00）", () => {
    expect(snapStartToHalfHour(1425)).toBe(1410); // 23:45 → 24:00 → 封顶 23:30
    expect(snapStartToHalfHour(1440)).toBe(1410);
  });
});

describe("halfHourGridTicks", () => {
  const ticks = halfHourGridTicks();

  it("共 49 条（0..48 × 30 分）", () => {
    expect(ticks.length).toBe(49);
  });

  it("首条 = 00:00 整点", () => {
    expect(ticks[0]).toEqual({ minutes: 0, isHalf: false, label: "00:00" });
  });

  it("半点条正确（第 1 条 = 00:30 半点）", () => {
    expect(ticks[1]).toEqual({ minutes: 30, isHalf: true, label: "00:30" });
  });

  it("08:00 / 08:30 标签正确", () => {
    expect(ticks[16]).toEqual({ minutes: 480, isHalf: false, label: "08:00" });
    expect(ticks[17]).toEqual({ minutes: 510, isHalf: true, label: "08:30" });
  });

  it("末条 = 24:00 底部整点刻度", () => {
    expect(ticks[48]).toEqual({ minutes: 1440, isHalf: false, label: "24:00" });
  });
});

describe("SHORT_SEGMENT_THRESHOLD_PX", () => {
  it("= 30（不足半小时的段文字外置）", () => {
    expect(SHORT_SEGMENT_THRESHOLD_PX).toBe(30);
  });
});

describe("isShortSegment", () => {
  it("真实高度 < 阈值 → true（文字外置到右侧）", () => {
    expect(isShortSegment(350, 360, SHORT_SEGMENT_THRESHOLD_PX)).toBe(true); // 10 分钟
    expect(isShortSegment(0, 5, SHORT_SEGMENT_THRESHOLD_PX)).toBe(true); // 5 分钟
  });

  it("恰好等于阈值 → false（不算短）", () => {
    expect(isShortSegment(0, 30, SHORT_SEGMENT_THRESHOLD_PX)).toBe(false);
  });

  it("长段 → false", () => {
    expect(isShortSegment(0, 330, SHORT_SEGMENT_THRESHOLD_PX)).toBe(false);
  });

  it("阈值参数化可覆盖", () => {
    expect(isShortSegment(0, 10, 22)).toBe(true);
    expect(isShortSegment(0, 25, 22)).toBe(false);
  });
});

import { Segment } from "../src/types";

const seg = (start: string, end: string): Segment => ({
  start, end, activity: "x", categoryId: "other", lineNumber: 1,
});

describe("emptySlotFill（点空隙填满：上块结束 → 下块开始）", () => {
  it("上下都有块 → 填满中间空隙", () => {
    const segs = [seg("08:00", "09:00"), seg("11:00", "12:00")];
    expect(emptySlotFill(600, segs, { isToday: false, nowMin: 800 })).toEqual({
      start: "09:00", end: "11:00",
    });
  });

  it("上方无块 → 开始 00:00", () => {
    const segs = [seg("11:00", "12:00")];
    expect(emptySlotFill(300, segs, { isToday: false, nowMin: 800 })).toEqual({
      start: "00:00", end: "11:00",
    });
  });

  it("下方无块 + 今天 → 结束 = now", () => {
    const segs = [seg("08:00", "09:00")];
    expect(emptySlotFill(600, segs, { isToday: true, nowMin: 630 })).toEqual({
      start: "09:00", end: "10:30",
    });
  });

  it("下方无块 + 历史日 → 结束 = 24:00", () => {
    const segs = [seg("08:00", "09:00")];
    expect(emptySlotFill(600, segs, { isToday: false, nowMin: 630 })).toEqual({
      start: "09:00", end: "24:00",
    });
  });

  it("空天 + 今天 → 00:00 ~ now", () => {
    expect(emptySlotFill(600, [], { isToday: true, nowMin: 630 })).toEqual({
      start: "00:00", end: "10:30",
    });
  });

  it("空天 + 历史 → 00:00 ~ 24:00", () => {
    expect(emptySlotFill(600, [], { isToday: false, nowMin: 630 })).toEqual({
      start: "00:00", end: "24:00",
    });
  });

  it("进行中段（今天）的 effectiveEnd = now，可作上块", () => {
    const segs = [seg("08:00", "ing")];
    expect(emptySlotFill(601, segs, { isToday: true, nowMin: 600 })).toEqual({
      start: "10:00", end: "11:00",
    });
  });

  it("兜底：算出 end ≤ start → 改为 start+1h（封顶）", () => {
    const segs = [seg("08:00", "14:00")];
    expect(emptySlotFill(900, segs, { isToday: true, nowMin: 780 })).toEqual({
      start: "14:00", end: "15:00",
    });
  });
});
