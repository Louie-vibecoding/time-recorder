import { describe, it, expect } from "vitest";
import { splitDuplicateLeaves } from "../src/leafDedup";

describe("splitDuplicateLeaves", () => {
  it("空数组 → keep 为 null、无多余", () => {
    expect(splitDuplicateLeaves([])).toEqual({ keep: null, extras: [] });
  });

  it("单个 → 保留它、无多余", () => {
    const a = { id: "a" };
    expect(splitDuplicateLeaves([a])).toEqual({ keep: a, extras: [] });
  });

  it("多个 → 保留第一个、其余进 extras（顺序保持）", () => {
    const a = { id: "a" };
    const b = { id: "b" };
    const c = { id: "c" };
    const r = splitDuplicateLeaves([a, b, c]);
    expect(r.keep).toBe(a);
    expect(r.extras).toEqual([b, c]);
  });
});
