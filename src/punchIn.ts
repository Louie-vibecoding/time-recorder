import { RecordsFileManager } from "./recordsFile";
import { UndoStack } from "./undoStack";
import { appendLine, formatSegmentLine, replaceLine, parseDayContent } from "./parser";
import { isOpenEnd } from "./time";
import { Category } from "./types";

export interface PunchInArgs {
  date: string;     // "2026-6-17"
  activity: string; // "学习" or "学习obsidian"
  now: string;      // "HH:MM" — the close-and-open time
}

/**
 * Punch-in core action:
 * 1. Read today's file content.
 * 2. Find the open segment (isOpenEnd: 'ing' or legacy '00:00') and close it with `now`.
 * 3. Append a new open segment "- [ ] now - ing activity".
 * 4. Save the before-state to undoStack.
 * 5. Write the new content.
 */
export async function punchIn(
  mgr: RecordsFileManager,
  undo: UndoStack,
  args: PunchInArgs,
  categoriesForInfer?: Category[],
): Promise<void> {
  await mgr.ensureFileExists(args.date);
  const filePath = mgr.getDayFilePath(args.date);
  const before = await mgr.readDayContent(args.date);

  // Save snapshot for undo BEFORE any modifications
  undo.push({
    filePath,
    beforeLines: before.split("\n"),
    description: `Punched in ${args.activity} at ${args.now}`,
    timestamp: Date.now(),
  });

  // Parse and find any open segment
  const categories = categoriesForInfer ?? [];
  const segments = parseDayContent(before, categories);
  let after = before;

  const openSeg = segments.find(s => isOpenEnd(s.end));
  if (openSeg) {
    const closed = formatSegmentLine({
      ...openSeg,
      end: args.now,
    });
    after = replaceLine(after, openSeg.lineNumber, closed);
  }

  // Append the new open segment
  const newLine = formatSegmentLine({
    start: args.now,
    end: "ing",
    activity: args.activity,
    categoryId: "",
    lineNumber: -1,
  });
  after = appendLine(after, newLine);

  await mgr.writeDayContent(args.date, after);
}

/** Undo the last punch-in. Restores the file to its prior state. */
export async function undoLast(
  mgr: RecordsFileManager,
  undo: UndoStack,
): Promise<boolean> {
  const entry = undo.pop();
  if (!entry) return false;
  const restored = entry.beforeLines.join("\n");
  await mgr.writeRawByPath(entry.filePath, restored);
  return true;
}
