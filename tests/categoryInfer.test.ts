import { describe, it, expect } from "vitest";
import { inferCategoryId } from "../src/categoryInfer";
import { Category } from "../src/types";

const CATS: Category[] = [
  { id: "sleep", name: "睡眠", emoji: "😴", aliases: ["睡觉", "午睡"] },
  { id: "study", name: "学习", emoji: "📚", aliases: ["阅读", "复习"] },
  { id: "meal",  name: "饮食", emoji: "🍱", aliases: ["吃饭", "早饭", "晚饭"] },
  { id: "social", name: "社交", emoji: "💬", aliases: ["微信", "聊天"] },
];

describe("inferCategoryId", () => {
  it("exact match by name (case-insensitive, trimmed)", () => {
    expect(inferCategoryId("睡眠", CATS)).toBe("sleep");
    expect(inferCategoryId("  学习  ", CATS)).toBe("study");
  });

  it("substring match — activity contains category name", () => {
    expect(inferCategoryId("学习obsidian", CATS)).toBe("study");
  });

  it("matches by alias keyword from category.aliases", () => {
    expect(inferCategoryId("吃早饭", CATS)).toBe("meal");
    expect(inferCategoryId("微信聊天", CATS)).toBe("social");
  });

  it("matches a user-defined custom alias", () => {
    const custom: Category[] = [
      { id: "study", name: "学习", emoji: "📚", aliases: ["股市", "obsidian"] },
    ];
    expect(inferCategoryId("看股市", custom)).toBe("study");
    expect(inferCategoryId("整理obsidian笔记", custom)).toBe("study");
  });

  it('falls back to "other" when no category matches', () => {
    expect(inferCategoryId("看书", CATS)).toBe("other");
    expect(inferCategoryId("", CATS)).toBe("other");
  });

  it('returns "other" for an activity after its only matching category is removed', () => {
    const before = inferCategoryId("微信聊天", CATS);
    expect(before).toBe("social");
    const without = CATS.filter((c) => c.id !== "social");
    expect(inferCategoryId("微信聊天", without)).toBe("other");
  });

  it("tolerates a category missing the aliases field", () => {
    const legacy = [{ id: "x", name: "杂项", emoji: "📦" } as unknown as Category];
    expect(() => inferCategoryId("随便", legacy)).not.toThrow();
    expect(inferCategoryId("随便", legacy)).toBe("other");
  });

  it("tolerates a category missing the name field (dirty data.json)", () => {
    const dirty = [{ id: "x", emoji: "📦", aliases: ["关键词"] } as unknown as Category];
    expect(() => inferCategoryId("随便", dirty)).not.toThrow();
    // 名字缺失的分类在精确/子串匹配阶段被跳过，但其 aliases 仍可命中
    expect(inferCategoryId("含关键词", dirty)).toBe("x");
    expect(inferCategoryId("无关", dirty)).toBe("other");
  });
});
