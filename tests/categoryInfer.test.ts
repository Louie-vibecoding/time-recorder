import { describe, it, expect } from "vitest";
import { inferCategoryId } from "../src/categoryInfer";
import { DEFAULT_CATEGORIES } from "../src/settings";

describe("inferCategoryId", () => {
  it("exact match by name", () => {
    expect(inferCategoryId("睡眠", DEFAULT_CATEGORIES)).toBe("sleep");
    expect(inferCategoryId("学习", DEFAULT_CATEGORIES)).toBe("study");
  });

  it("substring match (activity contains category name)", () => {
    expect(inferCategoryId("学习obsidian", DEFAULT_CATEGORIES)).toBe("study");
    expect(inferCategoryId("吃早饭", DEFAULT_CATEGORIES)).toBe("meal"); // "饮食" doesn't substring-match "吃早饭"...
  });

  it('falls back to "other" when no match', () => {
    expect(inferCategoryId("看书", DEFAULT_CATEGORIES)).toBe("other");
    expect(inferCategoryId("", DEFAULT_CATEGORIES)).toBe("other");
  });

  it("matches by alias when activity contains a known alias keyword", () => {
    // "饮食" category should match aliases like "吃饭", "早饭", "晚饭"
    expect(inferCategoryId("吃午饭", DEFAULT_CATEGORIES)).toBe("meal");
    expect(inferCategoryId("早饭", DEFAULT_CATEGORIES)).toBe("meal");
    // "个人卫生" should match "洗漱", "上厕所"
    expect(inferCategoryId("洗漱", DEFAULT_CATEGORIES)).toBe("hygiene");
    expect(inferCategoryId("上厕所", DEFAULT_CATEGORIES)).toBe("hygiene");
    // "陪伴雨珂" should match "雨珂"
    expect(inferCategoryId("和雨珂休息", DEFAULT_CATEGORIES)).toBe("yuke");
    expect(inferCategoryId("送雨珂回家", DEFAULT_CATEGORIES)).toBe("yuke");
    // "社交" should match "微信", "聊天"
    expect(inferCategoryId("微信聊天", DEFAULT_CATEGORIES)).toBe("social");
  });

  it("is case-insensitive and trims activity", () => {
    expect(inferCategoryId("  学习  ", DEFAULT_CATEGORIES)).toBe("study");
  });
});
