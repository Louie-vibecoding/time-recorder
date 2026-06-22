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

  it("treats end='00:00' as open segment when activity present", () => {
    const content = `- [ ] 16:05 - 00:00 学习\n`;
    const segments = parseDayContent(content, DEFAULT_CATEGORIES);
    expect(segments.length).toBe(1);
    expect(segments[0].end).toBe("00:00");
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
