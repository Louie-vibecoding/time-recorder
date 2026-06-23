import { App, Modal, Notice } from "obsidian";
import { Category, TimeRecorderSettings } from "./types";
import { RecordsFileManager } from "./recordsFile";
import { UndoStack } from "./undoStack";
import { punchIn, undoLast } from "./punchIn";
import { nowHHMM, minutesDiff, formatDuration } from "./time";
import { getTodayDateString } from "./date";
import { openTodayFile, showPunchSuccessNotice } from "./openTodayFile";

export class GridModal extends Modal {
  constructor(
    app: App,
    private settings: TimeRecorderSettings,
    private recordsFile: RecordsFileManager,
    private undoStack: UndoStack,
    private onPunched?: () => void,
    private openCustomActivity?: () => void,
  ) {
    super(app);
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("tr-grid-modal");

    // Header: current activity
    await this.renderHeader(contentEl);

    // 3x3 grid
    const grid = contentEl.createDiv({ cls: "tr-grid" });
    const cats = this.settings.categories.slice(0, 8);

    for (const cat of cats) {
      this.renderCell(grid, cat, cat.emoji, cat.name, () => this.handlePunch(cat.name));
    }

    // Custom activity cell ✏️
    this.renderCell(grid, null, "✏️", "自定义…", () => {
      this.close();
      this.openCustomActivity?.();
    });

    // Footer
    const footer = contentEl.createDiv({ cls: "tr-grid-footer" });
    const undoBtn = footer.createEl("button", { text: "↶ 撤销最近一次" });
    undoBtn.addEventListener("click", async () => {
      const ok = await undoLast(this.recordsFile, this.undoStack);
      if (ok) new Notice("已撤销 ✅");
      else new Notice("没有可撤销的操作");
      this.close();
      this.onPunched?.();
    });
    if (this.undoStack.size() === 0) undoBtn.setAttribute("disabled", "true");

    const openTodayBtn = footer.createEl("button", { text: "📄 今日记录" });
    openTodayBtn.addEventListener("click", async () => {
      this.close();
      await openTodayFile(this.app, this.recordsFile);
    });

    const closeBtn = footer.createEl("button", { text: "关闭" });
    closeBtn.addEventListener("click", () => this.close());
  }

  private async renderHeader(parent: HTMLElement) {
    const header = parent.createDiv({ cls: "tr-grid-header" });
    const today = getTodayDateString();
    const day = await this.recordsFile.readDayRecord(today);
    const open = day.segments.find(s => s.end === "00:00");
    if (open) {
      const cat = this.settings.categories.find(c => c.id === open.categoryId);
      const emoji = cat ? cat.emoji : "❓";
      const duration = minutesDiff(open.start, nowHHMM());
      header.setText(`现在在做：${emoji} ${open.activity}（${open.start} 起 ${formatDuration(duration)}）`);
    } else {
      header.setText("尚未开始任何活动");
    }
  }

  private renderCell(
    parent: HTMLElement,
    _cat: Category | null,
    emoji: string,
    label: string,
    onClick: () => void,
  ) {
    const cell = parent.createDiv({ cls: "tr-cell" });
    cell.createDiv({ cls: "tr-cell-emoji", text: emoji });
    cell.createDiv({ cls: "tr-cell-label", text: label });
    cell.addEventListener("click", onClick);
  }

  private async handlePunch(activity: string) {
    const now = nowHHMM();
    const today = getTodayDateString();
    try {
      await punchIn(this.recordsFile, this.undoStack, {
        date: today,
        activity,
        now,
      }, this.settings.categories);
      showPunchSuccessNotice(this.app, this.recordsFile, activity, now);
      this.close();
      this.onPunched?.();
    } catch (err) {
      new Notice(`打卡失败：${(err as Error).message}`);
      console.error("Punch-in failed", err);
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
