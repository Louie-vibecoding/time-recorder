import { describe, it, expect } from "vitest";
import {
  snapStartToHalfHour,
  halfHourGridTicks,
  isShortSegment,
  SHORT_SEGMENT_THRESHOLD_PX,
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
