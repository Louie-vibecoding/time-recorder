import { App, Modal, Notice } from "obsidian";
import { Category, TimeRecorderSettings } from "./types";
import { RecordsFileManager } from "./recordsFile";
import { UndoStack } from "./undoStack";
import { punchIn, undoLast } from "./punchIn";
import { nowHHMM, minutesDiff, formatDuration, isOpenEnd } from "./time";
import { getTodayDateString } from "./date";
import { openTodayFile, showPunchSuccessNotice } from "./openTodayFile";
import { segmentColor } from "./segmentColor";

export class GridModal extends Modal {
  constructor(
    app: App,
    private settings: TimeRecorderSettings,
    private recordsFile: RecordsFileManager,
    private undoStack: UndoStack,
    private onPunched?: () => void,
    private openCustomActivity?: () => void,
    private openSummary?: () => void,
    private openTimeline?: () => void,
  ) {
    super(app);
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("tr-grid-modal");

    // Header: current activity
    await this.renderHeader(contentEl);

    // 分类网格（3 列自动换行）：显示全部分类 + 末尾「自定义…」格。
    // 分类数不再硬限制为 8——加分类直接进 settings.categories，网格自动多排行。
    const grid = contentEl.createDiv({ cls: "tr-grid" });
    const cats = this.settings.categories;

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
    const undoBtn = footer.createEl("button", { text: "↶ 撤销" });
    undoBtn.addEventListener("click", async () => {
      const ok = await undoLast(this.recordsFile, this.undoStack);
      if (ok) new Notice("已撤销 ✅");
      else new Notice("没有可撤销的操作");
      this.close();
      this.onPunched?.();
    });
    if (this.undoStack.size() === 0) undoBtn.setAttribute("disabled", "true");

    const openTodayBtn = footer.createEl("button", { text: "📄 今日" });
    openTodayBtn.addEventListener("click", async () => {
      this.close();
      await openTodayFile(this.app, this.recordsFile);
    });

    const openSummaryBtn = footer.createEl("button", { text: "📊 汇总" });
    openSummaryBtn.addEventListener("click", () => {
      this.close();
      this.openSummary?.();
    });

    const openTimelineBtn = footer.createEl("button", { text: "📅 时间轴" });
    openTimelineBtn.addEventListener("click", () => {
      this.close();
      this.openTimeline?.();
    });

    const closeBtn = footer.createEl("button", { text: "✕ 关闭" });
    closeBtn.addEventListener("click", () => this.close());
  }

  private async renderHeader(parent: HTMLElement) {
    const header = parent.createDiv({ cls: "tr-grid-header" });
    const today = getTodayDateString();
    const day = await this.recordsFile.readDayRecord(today);
    const open = day.segments.find(s => isOpenEnd(s.end));
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
    cat: Category | null,
    emoji: string,
    label: string,
    onClick: () => void,
  ) {
    const cell = parent.createDiv({ cls: "tr-cell" });
    if (cat) {
      const color = segmentColor(cat.id, this.settings.categories);
      if (color) {
        cell.style.setProperty("--tr-cat-bg", color.bg);
        cell.style.setProperty("--tr-cat-border", color.border);
      }
    }
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
