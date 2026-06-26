import { describe, it, expect } from "vitest";
import { generateCategoryId } from "../src/idgen";

describe("generateCategoryId", () => {
  it("slugs an ascii name to lowercase", () => {
    expect(generateCategoryId("Study", [])).toBe("study");
    expect(generateCategoryId("My Fun Time", [])).toBe("my-fun-time");
  });

  it("falls back to 'cat' for names with no ascii alnum (e.g. Chinese)", () => {
    expect(generateCategoryId("学习", [])).toBe("cat");
  });

  it("never returns an empty id", () => {
    expect(generateCategoryId("", [])).toBe("cat");
    expect(generateCategoryId("   ", [])).toBe("cat");
  });

  it("avoids the reserved id 'other'", () => {
    expect(generateCategoryId("other", [])).toBe("other-2");
  });

  it("suffixes to stay unique against existing ids", () => {
    expect(generateCategoryId("work", ["work"])).toBe("work-2");
    expect(generateCategoryId("work", ["work", "work-2"])).toBe("work-3");
    expect(generateCategoryId("学习", ["cat"])).toBe("cat-2");
  });
});
