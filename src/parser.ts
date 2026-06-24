import { Segment, Category } from "./types";
import { formatHHMM, parseHHMM } from "./time";
import { inferCategoryId } from "./categoryInfer";

const SEGMENT_REGEX = /^(\s*)([-*])\s+\[[ xX]\]\s+(\d{1,2}:\d{1,2})\s*-\s*(\d{1,2}:\d{1,2}|ing)(?=\s|$)\s*(.*)$/;

export function parseDayContent(content: string, categories: Category[]): Segment[] {
  const lines = content.split("\n");
  const segments: Segment[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith(">")) continue;
    const match = line.match(SEGMENT_REGEX);
    if (!match) continue;
    const [, , , start, end, rest] = match;
    const activity = rest.trim();
    if (start === "00:00" && end === "00:00" && activity === "") continue;
    if (isNaN(parseHHMM(start))) continue;
    // "ing" is a valid in-progress marker (not a parseable time); everything
    // else must parse as HH:MM (or the special 24:00 true-midnight end).
    if (end !== "ing" && isNaN(parseHHMM(end))) continue;
    segments.push({
      start,
      end,
      activity,
      categoryId: inferCategoryId(activity, categories),
      lineNumber: i,
    });
  }
  return segments;
}

export function formatSegmentLine(seg: Segment): string {
  const startMin = parseHHMM(seg.start);
  const start = isNaN(startMin) ? seg.start : formatHHMM(startMin);
  // "ing" (in-progress) and "24:00" (true midnight) are written verbatim;
  // formatHHMM would mangle them (it wraps 24:00 → 00:00).
  let end: string;
  if (seg.end === "ing" || seg.end === "24:00") {
    end = seg.end;
  } else {
    const endMin = parseHHMM(seg.end);
    end = isNaN(endMin) ? seg.end : formatHHMM(endMin);
  }
  return `- [ ] ${start} - ${end} ${seg.activity}`.trimEnd();
}

export function replaceLine(content: string, lineNumber: number, newLine: string): string {
  const lines = content.split("\n");
  if (lineNumber < 0 || lineNumber >= lines.length) return content;
  lines[lineNumber] = newLine;
  return lines.join("\n");
}

export function appendLine(content: string, newLine: string): string {
  if (content === "") return newLine + "\n";
  const trimmed = content.endsWith("\n") ? content : content + "\n";
  return trimmed + newLine + "\n";
}
