import { describe, it, expect } from "vitest";
import { segmentColor } from "../src/segmentColor";
import { Category } from "../src/types";

const cats: Category[] = [
  { id: "sleep", name: "睡眠", emoji: "😴", aliases: [] }, // index 0 → hue 210
  { id: "study", name: "学习", emoji: "📚", aliases: [] }, // index 1 → hue 145
];

describe("segmentColor", () => {
  it("已知分类按下标取对应色相（含 bg/border/accent）", () => {
    const c = segmentColor("study", cats);
    expect(c).not.toBeNull();
    expect(c!.bg).toContain("145");
    expect(c!.border).toContain("145");
    expect(c!.accent).toContain("145");
    expect(c!.bg).toContain("hsla");
    expect(c!.accent).toContain("hsl(");
  });

  it("第一个分类用调色板首色相 210", () => {
    expect(segmentColor("sleep", cats)!.accent).toContain("210");
  });

  it("other → null（中性）", () => {
    expect(segmentColor("other", cats)).toBeNull();
  });

  it("未知 id → null", () => {
    expect(segmentColor("nope", cats)).toBeNull();
  });

  it("下标超过调色板长度时循环复用（第 13 个分类回到首色相 210）", () => {
    const many: Category[] = Array.from({ length: 13 }, (_, i) => ({
      id: `c${i}`,
      name: `c${i}`,
      emoji: "🔵",
      aliases: [],
    }));
    // index 12 → 12 % 12 = 0 → hue 210
    expect(segmentColor("c12", many)!.accent).toContain("210");
  });

  it("同一 id 多次调用结果稳定", () => {
    expect(segmentColor("study", cats)).toEqual(segmentColor("study", cats));
  });
});
