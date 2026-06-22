/** Parse "HH:MM" → total minutes since midnight. Returns NaN on invalid. */
export function parseHHMM(s: string): number {
  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return NaN;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return NaN;
  return h * 60 + min;
}

/** Convert total minutes → "HH:MM" (zero-padded). */
export function formatHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minutes from start to end. Treats end="00:00" as 24:00 (open segment of unknown end). */
export function minutesDiff(start: string, end: string): number {
  const s = parseHHMM(start);
  let e = parseHHMM(end);
  if (end === "00:00") e = 24 * 60;
  if (isNaN(s) || isNaN(e)) return 0;
  return e - s;
}

/** Format minute count as "Xh Ymin" or "Ymin" if under an hour. */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}min`;
}

/** Current wall-clock time as "HH:MM". */
export function nowHHMM(): string {
  const d = new Date();
  return formatHHMM(d.getHours() * 60 + d.getMinutes());
}

/** Convention: end="00:00" means the segment is still open. */
export function isOpenEnd(end: string): boolean {
  return end === "00:00";
}
