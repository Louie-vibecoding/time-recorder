import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { TimeRecorderSettings } from "./types";
import { RecordsFileManager } from "./recordsFile";
import {
  summarizeDay,
  summarizePeriod,
  formatSummaryAsMarkdown,
  formatPeriodSummaryAsMarkdown,
  CategoryBucket,
} from "./summarize";
import { nowHHMM, formatDuration } from "./time";
import { getTodayDateString, addDays } from "./date";
import { weekRange, monthRange, enumerateDates, elapsedInPeriod } from "./periodRange";
import { segmentColor } from "./segmentColor";

export const VIEW_TYPE_TODAY_SUMMARY = "time-recorder-today-summary";

type Period = "day" | "week" | "month";

export class TodaySummaryView extends ItemView {
  private period: Period = "day";
  private anchor: string = getTodayDateString();

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

    this.renderPeriodTabs(container);

    if (this.period === "day") {
      await this.renderDay(container);
    } else {
      await this.renderPeriod(container);
    }
  }

  private renderPeriodTabs(container: HTMLElement) {
    const tabs = container.createDiv({ cls: "tr-summary-tabs" });
    const mk = (label: string, p: Period) => {
      const btn = tabs.createEl("button", { text: label });
      if (this.period === p) btn.addClass("mod-cta");
      btn.addEventListener("click", async () => {
        if (this.period !== p) {
          this.period = p;
          this.anchor = getTodayDateString();
          await this.refresh();
        }
      });
    };
    mk("今日", "day");
    mk("本周", "week");
    mk("本月", "month");
  }

  private async renderDay(container: HTMLElement) {
    const today = getTodayDateString();
    const day = await this.readDaySafe(today);
    const summary = summarizeDay(day, this.settings.categories, nowHHMM());

    const header = container.createDiv({ cls: "tr-summary-header" });
    header.createEl("h3", { text: `📅 ${today} 今日汇总` });
    const sub = header.createEl("div", { cls: "tr-summary-sub" });
    sub.setText(
      `已记录 ${formatDuration(summary.totalRecordedMinutes)} / 24h（${(100 - summary.unrecordedPercent).toFixed(0)}%）`,
    );

    this.renderTable(container, summary.byCategory, summary.unrecordedMinutes, summary.unrecordedPercent);

    const footer = container.createDiv({ cls: "tr-summary-footer" });
    const copyBtn = footer.createEl("button", { text: "📋 复制汇总文本" });
    copyBtn.addEventListener("click", async () => {
      await this.copyText(formatSummaryAsMarkdown(day, summary, this.settings.categories));
    });
  }

  private async renderPeriod(container: HTMLElement) {
    const range = this.period === "week" ? weekRange(this.anchor) : monthRange(this.anchor);
    const today = getTodayDateString();
    const now = nowHHMM();
    const dates = enumerateDates(range.start, range.end);
    const days = await Promise.all(dates.map((d) => this.readDaySafe(d)));
    const { elapsedMinutes, elapsedDays } = elapsedInPeriod(range.start, range.end, today, now);
    const summary = summarizePeriod(days, this.settings.categories, {
      today,
      now,
      denominatorMinutes: elapsedMinutes,
    });
    const label = this.period === "week" ? "本周" : "本月";

    // 导航
    const nav = container.createDiv({ cls: "tr-summary-nav" });
    const prevBtn = nav.createEl("button", { text: this.period === "week" ? "‹ 上一周" : "‹ 上月" });
    prevBtn.addEventListener("click", async () => {
      this.anchor = addDays(range.start, -1);
      await this.refresh();
    });
    const curBtn = nav.createEl("button", { text: label });
    curBtn.addEventListener("click", async () => {
      this.anchor = getTodayDateString();
      await this.refresh();
    });
    const nextBtn = nav.createEl("button", { text: this.period === "week" ? "下一周 ›" : "下月 ›" });
    nextBtn.addEventListener("click", async () => {
      this.anchor = addDays(range.end, 1);
      await this.refresh();
    });

    // 头部
    const header = container.createDiv({ cls: "tr-summary-header" });
    header.createEl("h3", { text: `📅 ${label} ${range.start} ~ ${range.end}` });
    const sub = header.createEl("div", { cls: "tr-summary-sub" });
    const recordedPct = elapsedMinutes > 0 ? (100 - summary.unrecordedPercent).toFixed(0) : "0";
    sub.setText(
      `已记录 ${formatDuration(summary.totalRecordedMinutes)} / 已过去 ${formatDuration(elapsedMinutes)}（${recordedPct}%）`,
    );
    const avg = header.createEl("div", { cls: "tr-summary-sub" });
    const avgMin = elapsedDays > 0 ? Math.round(summary.totalRecordedMinutes / elapsedDays) : 0;
    avg.setText(`日均 ${formatDuration(avgMin)}`);

    this.renderTable(container, summary.byCategory, summary.unrecordedMinutes, summary.unrecordedPercent);

    const footer = container.createDiv({ cls: "tr-summary-footer" });
    const copyBtn = footer.createEl("button", { text: "📋 复制汇总文本" });
    copyBtn.addEventListener("click", async () => {
      await this.copyText(formatPeriodSummaryAsMarkdown(`${label} ${range.start} ~ ${range.end}`, summary));
    });
  }

  private renderTable(
    container: HTMLElement,
    buckets: CategoryBucket[],
    unrecMin: number,
    unrecPct: number,
  ) {
    const table = container.createEl("table", { cls: "tr-summary-table" });
    const thead = table.createEl("thead").createEl("tr");
    ["排", "类别", "时长", "占比"].forEach((t) => thead.createEl("th", { text: t }));
    const tbody = table.createEl("tbody");

    buckets.forEach((b, i) => {
      const row = tbody.createEl("tr");
      row.createEl("td", { text: String(i + 1) });
      const catTd = row.createEl("td");
      const color = segmentColor(b.categoryId, this.settings.categories);
      if (color) {
        const dot = catTd.createSpan({ cls: "tr-cat-dot" });
        dot.style.background = color.accent;
      }
      catTd.createSpan({ text: `${b.emoji} ${b.name}` });
      row.createEl("td", { text: formatDuration(b.minutes) });
      row.createEl("td", { text: `${b.percent.toFixed(1)}%` });
    });

    const unrec = tbody.createEl("tr", { cls: "tr-unrecorded-row" });
    unrec.createEl("td", { text: "" });
    unrec.createEl("td", { text: "⚪ 未记录" });
    unrec.createEl("td", { text: formatDuration(unrecMin) });
    unrec.createEl("td", { text: `${unrecPct.toFixed(1)}%` });
  }

  private async readDaySafe(date: string) {
    try {
      return await this.recordsFile.readDayRecord(date);
    } catch {
      return { date, filePath: this.recordsFile.getDayFilePath(date), segments: [] };
    }
  }

  private async copyText(md: string) {
    try {
      await navigator.clipboard.writeText(md);
      new Notice("已复制到剪贴板 ✅");
    } catch (err) {
      new Notice(`复制失败：${(err as Error).message}`);
    }
  }
}
