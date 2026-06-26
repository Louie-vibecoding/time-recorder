import { describe, it, expect } from "vitest";
import { parseAliases, validateCategoryName } from "../src/settingsValidation";
import { Category } from "../src/types";

describe("parseAliases", () => {
  it("splits on commas, trims, drops empties", () => {
    expect(parseAliases("吃饭, 早饭 ,, 晚饭 ")).toEqual(["吃饭", "早饭", "晚饭"]);
  });
  it("handles full-width comma too", () => {
    expect(parseAliases("微信，聊天")).toEqual(["微信", "聊天"]);
  });
  it("dedupes (case-insensitive) keeping first form", () => {
    expect(parseAliases("Obsidian, obsidian, OBSIDIAN")).toEqual(["Obsidian"]);
  });
  it("returns [] for empty/whitespace input", () => {
    expect(parseAliases("")).toEqual([]);
    expect(parseAliases("  ,  , ")).toEqual([]);
  });
});

describe("validateCategoryName", () => {
  const cats: Category[] = [
    { id: "study", name: "学习", emoji: "📚", aliases: [] },
    { id: "meal", name: "饮食", emoji: "🍱", aliases: [] },
  ];
  it("returns null for a valid, unique name", () => {
    expect(validateCategoryName("运动", cats, 1)).toBeNull();
  });
  it("rejects an empty name", () => {
    expect(validateCategoryName("   ", cats, 1)).toMatch(/不能为空/);
  });
  it("rejects a duplicate name (case-insensitive), excluding self", () => {
    expect(validateCategoryName("学习", cats, 1)).toMatch(/已存在/);
  });
  it("allows keeping the same name at its own index", () => {
    expect(validateCategoryName("学习", cats, 0)).toBeNull();
  });
});
