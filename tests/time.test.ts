import { describe, it, expect } from "vitest";
import {
  parseHHMM,
  formatHHMM,
  minutesDiff,
  formatDuration,
  nowHHMM,
  isOpenEnd,
} from "../src/time";

describe("parseHHMM", () => {
  it("parses zero-padded times", () => {
    expect(parseHHMM("08:30")).toBe(8 * 60 + 30);
    expect(parseHHMM("00:00")).toBe(0);
    expect(parseHHMM("23:59")).toBe(23 * 60 + 59);
  });

  it("accepts non-padded times (tolerant)", () => {
    expect(parseHHMM("8:30")).toBe(8 * 60 + 30);
    expect(parseHHMM("9:5")).toBe(9 * 60 + 5);
  });

  it("returns NaN for invalid input", () => {
    expect(parseHHMM("foo")).toBeNaN();
    expect(parseHHMM("25:00")).toBeNaN();
    expect(parseHHMM("12:60")).toBeNaN();
    expect(parseHHMM("")).toBeNaN();
  });
});

describe("formatHHMM", () => {
  it("zero-pads minute values to HH:MM", () => {
    expect(formatHHMM(8 * 60 + 30)).toBe("08:30");
    expect(formatHHMM(0)).toBe("00:00");
    expect(formatHHMM(23 * 60 + 59)).toBe("23:59");
    expect(formatHHMM(5)).toBe("00:05");
  });
});

describe("minutesDiff", () => {
  it("computes minute differences", () => {
    expect(minutesDiff("08:00", "10:00")).toBe(120);
    expect(minutesDiff("08:30", "10:00")).toBe(90);
    expect(minutesDiff("08:00", "08:00")).toBe(0);
  });

  it("treats end='00:00' as 24:00 (full-day open segment)", () => {
    expect(minutesDiff("22:00", "00:00")).toBe(120);
  });
});

describe("formatDuration", () => {
  it("formats minutes as 'Xh Ymin'", () => {
    expect(formatDuration(60)).toBe("1h 0min");
    expect(formatDuration(90)).toBe("1h 30min");
    expect(formatDuration(0)).toBe("0min");
    expect(formatDuration(45)).toBe("45min");
  });
});

describe("nowHHMM", () => {
  it("returns a valid HH:MM string", () => {
    const result = nowHHMM();
    expect(result).toMatch(/^\d{2}:\d{2}$/);
    expect(parseHHMM(result)).not.toBeNaN();
  });
});

describe("isOpenEnd", () => {
  it("returns true for '00:00' string", () => {
    expect(isOpenEnd("00:00")).toBe(true);
  });

  it("returns false for any other time", () => {
    expect(isOpenEnd("08:30")).toBe(false);
    expect(isOpenEnd("23:59")).toBe(false);
  });
});
