import { describe, it, expect } from "vitest";
import { validateSegmentTimes } from "../src/segmentEdit";

describe("validateSegmentTimes", () => {
  it("有效 start + 有效 end（end 晚于 start）→ ok，保留 end", () => {
    const r = validateSegmentTimes("08:00", "09:30");
    expect(r).toEqual({ ok: true, normalizedEnd: "09:30" });
  });

  it("start 无效 → 报开始时间无效", () => {
    const r = validateSegmentTimes("abc", "09:30");
    expect(r).toEqual({ ok: false, error: "开始时间无效" });
  });

  it("结束留空 → 进行中（normalizedEnd=ing）", () => {
    const r = validateSegmentTimes("14:16", "");
    expect(r).toEqual({ ok: true, normalizedEnd: "ing" });
  });

  it("结束全是空格 → 进行中", () => {
    const r = validateSegmentTimes("14:16", "   ");
    expect(r).toEqual({ ok: true, normalizedEnd: "ing" });
  });

  it("结束 = ing → 进行中（保持）", () => {
    const r = validateSegmentTimes("14:16", "ing");
    expect(r).toEqual({ ok: true, normalizedEnd: "ing" });
  });

  it("结束 = 00:00（旧进行中兼容）→ 进行中", () => {
    const r = validateSegmentTimes("14:16", "00:00");
    expect(r).toEqual({ ok: true, normalizedEnd: "ing" });
  });

  it("结束非空但无法解析 → 报结束时间无效", () => {
    const r = validateSegmentTimes("08:00", "xyz");
    expect(r).toEqual({ ok: false, error: "结束时间无效" });
  });

  it("结束早于或等于开始 → 报必须晚于开始", () => {
    expect(validateSegmentTimes("09:00", "08:00")).toEqual({
      ok: false,
      error: "结束时间必须晚于开始时间",
    });
    expect(validateSegmentTimes("09:00", "09:00")).toEqual({
      ok: false,
      error: "结束时间必须晚于开始时间",
    });
  });

  it("结束 = 24:00（真午夜）→ ok，保留 24:00（非进行中）", () => {
    const r = validateSegmentTimes("22:00", "24:00");
    expect(r).toEqual({ ok: true, normalizedEnd: "24:00" });
  });
});
