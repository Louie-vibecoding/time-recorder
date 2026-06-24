import { describe, it, expect } from "vitest";
import { parseDayContent, formatSegmentLine, replaceLine, appendLine } from "../src/parser";
import { Segment } from "../src/types";
import { DEFAULT_CATEGORIES } from "../src/settings";

describe("parseDayContent", () => {
  it("parses standard checkbox lines", () => {
    const content = `- [ ] 08:30 - 10:00 学习obsidian\n- [ ] 10:00 - 11:00 看书\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(2);
    expect(segments[0]).toMatchObject({
      start: "08:30",
      end: "10:00",
      activity: "学习obsidian",
      lineNumber: 0,
    });
    expect(segments[1]).toMatchObject({
      start: "10:00",
      end: "11:00",
      activity: "看书",
      lineNumber: 1,
    });
  });

  it("accepts asterisk bullets", () => {
    const content = `* [ ] 08:30 - 10:00 学习\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
    expect(segments[0].start).toBe("08:30");
  });

  it("accepts checked boxes", () => {
    const content = `- [x] 08:30 - 10:00 学习\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
  });

  it("accepts non-padded times", () => {
    const content = `- [ ] 8:30 - 10:00 学习\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments[0].start).toBe("8:30");
  });

  it("skips empty template rows (00:00 - 00:00 with no activity)", () => {
    const content = `- [ ] 00:00 - 00:00 \n- [ ] 08:30 - 10:00 学习\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
    expect(segments[0].activity).toBe("学习");
  });

  it("treats end='00:00' as open segment when activity present (legacy compat)", () => {
    const content = `- [ ] 14:30 - 00:00 通勤\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
    expect(segments[0].end).toBe("00:00");
  });

  it("parses end='ing' as an in-progress segment", () => {
    const content = `- [ ] 16:12 - ing 编写插件\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
    expect(segments[0]).toMatchObject({
      start: "16:12",
      end: "ing",
      activity: "编写插件",
    });
  });

  it("does not mis-parse an 'ing'-prefixed end token as in-progress", () => {
    const content = `- [ ] 16:12 - ingredients 购物\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    // The end field is not a standalone "ing", so this line is not a valid segment.
    expect(segments.length).toBe(0);
  });

  it("parses end='24:00' as a true-midnight segment", () => {
    const content = `- [ ] 22:45 - 24:00 洗漱\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
    expect(segments[0].end).toBe("24:00");
  });

  it("ignores lines inside blockquotes", () => {
    const content = `> - [ ] 08:30 - 10:00 学习\n- [ ] 10:00 - 11:00 看书\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
    expect(segments[0].activity).toBe("看书");
  });

  it("ignores non-record lines (headings, regular text)", () => {
    const content = `# 反省日志\n这是引子\n- [ ] 08:30 - 10:00 学习\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
  });

  it("infers categoryId from activity name", () => {
    const content = `- [ ] 08:30 - 10:00 学习obsidian\n- [ ] 10:00 - 11:00 看书\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments[0].categoryId).toBe("study"); // "学习" matched
    expect(segments[1].categoryId).toBe("other"); // "看书" doesn't match any default
  });
});

describe("formatSegmentLine", () => {
  it("formats segment to canonical line", () => {
    const seg: Segment = {
      start: "08:30",
      end: "10:00",
      activity: "学习obsidian",
      categoryId: "study",
      lineNumber: 0,
    };
    expect(formatSegmentLine(seg)).toBe("- [ ] 08:30 - 10:00 学习obsidian");
  });

  it("zero-pads non-padded times on write", () => {
    const seg: Segment = {
      start: "8:30",
      end: "10:00",
      activity: "学习",
      categoryId: "study",
      lineNumber: 0,
    };
    expect(formatSegmentLine(seg)).toBe("- [ ] 08:30 - 10:00 学习");
  });

  it("writes 'ing' verbatim for an in-progress segment", () => {
    const seg: Segment = {
      start: "16:12",
      end: "ing",
      activity: "编写插件",
      categoryId: "other",
      lineNumber: 0,
    };
    expect(formatSegmentLine(seg)).toBe("- [ ] 16:12 - ing 编写插件");
  });

  it("writes '24:00' verbatim for a true-midnight segment", () => {
    const seg: Segment = {
      start: "22:45",
      end: "24:00",
      activity: "洗漱",
      categoryId: "other",
      lineNumber: 0,
    };
    expect(formatSegmentLine(seg)).toBe("- [ ] 22:45 - 24:00 洗漱");
  });
});

describe("replaceLine", () => {
  it("replaces a specific line in the content", () => {
    const content = "a\nb\nc\n";
    expect(replaceLine(content, 1, "B")).toBe("a\nB\nc\n");
  });

  it("preserves trailing newline state", () => {
    const content = "a\nb\nc";
    expect(replaceLine(content, 1, "B")).toBe("a\nB\nc");
  });
});

describe("appendLine", () => {
  it("appends a line preserving newline", () => {
    expect(appendLine("a\nb\n", "c")).toBe("a\nb\nc\n");
  });

  it("adds a newline if content doesn't end with one", () => {
    expect(appendLine("a\nb", "c")).toBe("a\nb\nc\n");
  });

  it("handles empty content", () => {
    expect(appendLine("", "a")).toBe("a\n");
  });
});
