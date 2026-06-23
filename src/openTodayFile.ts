import { App, Notice, TFile } from "obsidian";
import { RecordsFileManager } from "./recordsFile";
import { getTodayDateString } from "./date";

/**
 * Open today's time-record .md. If it doesn't exist, create an empty file
 * (from template) first, then open it (decision #20).
 * Pure Obsidian API, cross-platform safe (no Node).
 */
export async function openTodayFile(app: App, recordsFile: RecordsFileManager): Promise<void> {
  try {
    const today = getTodayDateString();
    await recordsFile.ensureFileExists(today); // boundary: create if missing (idempotent)

    const path = recordsFile.getDayFilePath(today);
    const tfile = app.vault.getAbstractFileByPath(path);
    if (tfile instanceof TFile) {
      await app.workspace.getLeaf(false).openFile(tfile);
    } else {
      // Fallback: a file just written via vault.adapter.write may not be indexed yet,
      // so getAbstractFileByPath can transiently return null. openLinkText resolves by path.
      await app.workspace.openLinkText(path, "", false);
    }
  } catch (err) {
    new Notice(`打开今日记录失败：${(err as Error).message}`);
    console.error("Open today file failed", err);
  }
}

export const SUCCESS_NOTICE_DURATION_MS = 8000;

/** Show the clickable punch-in success Notice that opens today's record on click. */
export function showPunchSuccessNotice(
  app: App,
  recordsFile: RecordsFileManager,
  activity: string,
  now: string,
): void {
  const notice = new Notice(`✅ ${activity} ${now} 起（点这里打开今日记录）`, SUCCESS_NOTICE_DURATION_MS);
  notice.noticeEl.addClass("tr-clickable-notice");
  notice.noticeEl.addEventListener("click", () => openTodayFile(app, recordsFile));
}
