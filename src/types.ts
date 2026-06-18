/**
 * One time segment from a daily record.
 * end="00:00" means "open" (still in progress).
 */
export interface Segment {
  start: string;      // "08:30"
  end: string;        // "10:00" or "00:00" (open)
  activity: string;   // "学习obsidian"
  categoryId: string; // inferred id (e.g., "study")
  lineNumber: number; // 0-indexed line in the source .md file
}

/** A whole day's record (the parsed contents of one .md file). */
export interface DayRecord {
  date: string;       // "2026-6-17"
  filePath: string;   // "反省日志/时间记录/2026-6-17 时间记录.md"
  segments: Segment[];
}

/** A category in the 9-grid selector. */
export interface Category {
  id: string;         // "study"
  name: string;       // "学习"
  emoji: string;      // "📚"
}

/** Plugin settings, persisted to data.json. */
export interface TimeRecorderSettings {
  version: number;
  recordsFolder: string;     // "反省日志/时间记录"
  templatePath: string;      // "反省日志/时间记录/timer template.md"
  categories: Category[];
}

/** A single undo step. */
export interface UndoEntry {
  filePath: string;
  beforeLines: string[];     // full file lines snapshot before the change
  description: string;       // human-readable, e.g., "Punched in 学习 at 16:05"
  timestamp: number;
}
