import { Segment, Category } from "./types";
import { formatHHMM, parseHHMM } from "./time";

const SEGMENT_REGEX = /^(\s*)([-*])\s+\[[ xX]\]\s+(\d{1,2}:\d{1,2})\s*-\s*(\d{1,2}:\d{1,2})\s*(.*)$/;

// TEMPORARY — replaced in Task 8 with proper categoryInfer.ts
function inferTemp(activity: string, categories: Category[]): string {
  for (const c of categories) {
    if (activity && activity.includes(c.name)) return c.id;
  }
  return "other";
}

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
    if (isNaN(parseHHMM(end))) continue;
    segments.push({
      start,
      end,
      activity,
      categoryId: inferTemp(activity, categories),
      lineNumber: i,
    });
  }
  return segments;
}

export function formatSegmentLine(seg: Segment): string {
  const startMin = parseHHMM(seg.start);
  const endMin = parseHHMM(seg.end);
  const start = isNaN(startMin) ? seg.start : formatHHMM(startMin);
  const end = isNaN(endMin) ? seg.end : formatHHMM(endMin);
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
