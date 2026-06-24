import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { TimeRecorderSettings } from "./types";
import { RecordsFileManager } from "./recordsFile";
import { summarizeDay, formatSummaryAsMarkdown } from "./summarize";
import { nowHHMM, formatDuration } from "./time";
import { getTodayDateString } from "./date";

export const VIEW_TYPE_TODAY_SUMMARY = "time-recorder-today-summary";

export class TodaySummaryView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private settings: TimeRecorderSettings,
    private recordsFile: RecordsFileManager,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_TODAY_SUMMARY;
  }

  getDisplayText(): string {
    return "Today Summary";
  }

  getIcon(): string {
    return "pie-chart";
  }

  async onOpen() {
    await this.refresh();
  }

  async onClose() {
    /* noop */
  }

  async refresh(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("tr-summary-container");

    const today = getTodayDateString();
    let day;
    try {
      day = await this.recordsFile.readDayRecord(today);
    } catch {
      day = { date: today, filePath: this.recordsFile.getDayFilePath(today), segments: [] };
    }
    const summary = summarizeDay(day, this.settings.categories, nowHHMM());

    // Header
    const header = container.createDiv({ cls: "tr-summary-header" });
    header.createEl("h3", { text: `📅 ${today} 今日汇总` });
    const sub = header.createEl("div", { cls: "tr-summary-sub" });
    const recordedH = formatDuration(summary.totalRecordedMinutes);
    sub.setText(`已记录 ${recordedH} / 24h（${(100 - summary.unrecordedPercent).toFixed(0)}%）`);

    // Table
    const table = container.createEl("table", { cls: "tr-summary-table" });
    const thead = table.createEl("thead").createEl("tr");
    ["排", "类别", "时长", "占比"].forEach(t => thead.createEl("th", { text: t }));
    const tbody = table.createEl("tbody");

    summary.byCategory.forEach((b, i) => {
      const row = tbody.createEl("tr");
      row.createEl("td", { text: String(i + 1) });
      row.createEl("td", { text: `${b.emoji} ${b.name}` });
      row.createEl("td", { text: formatDuration(b.minutes) });
      row.createEl("td", { text: `${b.percent.toFixed(1)}%` });
    });

    // Unrecorded row
    const unrec = tbody.createEl("tr", { cls: "tr-unrecorded-row" });
    unrec.createEl("td", { text: "" });
    unrec.createEl("td", { text: "⚪ 未记录" });
    unrec.createEl("td", { text: formatDuration(summary.unrecordedMinutes) });
    unrec.createEl("td", { text: `${summary.unrecordedPercent.toFixed(1)}%` });

    // Copy button
    const footer = container.createDiv({ cls: "tr-summary-footer" });
    const copyBtn = footer.createEl("button", { text: "📋 复制汇总文本" });
    copyBtn.addEventListener("click", async () => {
      const md = formatSummaryAsMarkdown(day, summary, this.settings.categories);
      try {
        await navigator.clipboard.writeText(md);
        new Notice("已复制到剪贴板 ✅");
      } catch (err) {
        new Notice(`复制失败：${(err as Error).message}`);
      }
    });
  }
}
