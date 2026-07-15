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
import { getTodayDateString, addDays, dayViewEffectiveNow, relativeDayLabel } from "./date";
import { weekRange, monthRange, enumerateDates, elapsedInPeriod } from "./periodRange";
import { segmentColor } from "./segmentColor";
import { serialize } from "./serialize";
import { t, format, mdStrings, relDayLabels } from "./i18n";

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
    return "Summary";
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

  /** 串行化刷新：并发 refresh 交错会导致内容重复渲染（根因见 serialize.ts 注释） */
  refresh: () => Promise<void> = serialize(() => this.doRefresh());

  private async doRefresh(): Promise<void> {
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
      btn.addEventListener("click", () => {
        if (this.period !== p) {
          this.period = p;
          this.anchor = getTodayDateString();
          void this.refresh();
        }
      });
    };
    mk(t("sumTabToday"), "day");
    mk(t("sumTabWeek"), "week");
    mk(t("sumTabMonth"), "month");
  }

  private async renderDay(container: HTMLElement) {
    const today = getTodayDateString();
    const anchor = this.anchor;
    const day = await this.readDaySafe(anchor);
    // 进行中段收口：今天→now，其它日期→24:00（忘关的段算到午夜，与周/月一致）。
    const now = dayViewEffectiveNow(anchor, today, nowHHMM());
    const summary = summarizeDay(day, this.settings.categories, now);

    // 导航：‹ 昨天 | 今天 | 明天 ›（镜像本周/本月）
    const nav = container.createDiv({ cls: "tr-summary-nav" });
    const prevBtn = nav.createEl("button", { text: t("sumPrevDay") });
    prevBtn.addEventListener("click", () => {
      this.anchor = addDays(anchor, -1);
      void this.refresh();
    });
    const curBtn = nav.createEl("button", { text: t("sumTodayBtn") });
    curBtn.addEventListener("click", () => {
      this.anchor = getTodayDateString();
      void this.refresh();
    });
    const nextBtn = nav.createEl("button", { text: t("sumNextDay") });
    nextBtn.addEventListener("click", () => {
      this.anchor = addDays(anchor, 1);
      void this.refresh();
    });

    const rel = relativeDayLabel(anchor, today, relDayLabels());
    const header = container.createDiv({ cls: "tr-summary-header" });
    header.createEl("h3", { text: `📅 ${rel ? rel + " " : ""}${anchor}` });
    const sub = header.createEl("div", { cls: "tr-summary-sub" });
    sub.setText(format(t("sumRecorded24"), {
      dur: formatDuration(summary.totalRecordedMinutes),
      pct: (100 - summary.unrecordedPercent).toFixed(0),
    }));

    this.renderTable(container, summary.byCategory, summary.unrecordedMinutes, summary.unrecordedPercent);

    const footer = container.createDiv({ cls: "tr-summary-footer" });
    const copyBtn = footer.createEl("button", { text: t("copySummary") });
    copyBtn.addEventListener("click", () => {
      void this.copyText(formatSummaryAsMarkdown(day, summary, this.settings.categories, mdStrings()));
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
    const label = this.period === "week" ? t("weekLabel") : t("monthLabel");

    // 导航
    const nav = container.createDiv({ cls: "tr-summary-nav" });
    const prevBtn = nav.createEl("button", { text: this.period === "week" ? t("prevWeek") : t("prevMonth") });
    prevBtn.addEventListener("click", () => {
      this.anchor = addDays(range.start, -1);
      void this.refresh();
    });
    const curBtn = nav.createEl("button", { text: label });
    curBtn.addEventListener("click", () => {
      this.anchor = getTodayDateString();
      void this.refresh();
    });
    const nextBtn = nav.createEl("button", { text: this.period === "week" ? t("nextWeek") : t("nextMonth") });
    nextBtn.addEventListener("click", () => {
      this.anchor = addDays(range.end, 1);
      void this.refresh();
    });

    // 头部
    const header = container.createDiv({ cls: "tr-summary-header" });
    header.createEl("h3", { text: `📅 ${label} ${range.start} ~ ${range.end}` });
    const sub = header.createEl("div", { cls: "tr-summary-sub" });
    const recordedPct = elapsedMinutes > 0 ? (100 - summary.unrecordedPercent).toFixed(0) : "0";
    sub.setText(format(t("sumRecordedElapsed"), {
      dur: formatDuration(summary.totalRecordedMinutes),
      elapsed: formatDuration(elapsedMinutes),
      pct: recordedPct,
    }));
    const avg = header.createEl("div", { cls: "tr-summary-sub" });
    const avgMin = elapsedDays > 0 ? Math.round(summary.totalRecordedMinutes / elapsedDays) : 0;
    avg.setText(format(t("dailyAvg"), { dur: formatDuration(avgMin) }));

    this.renderTable(container, summary.byCategory, summary.unrecordedMinutes, summary.unrecordedPercent);

    const footer = container.createDiv({ cls: "tr-summary-footer" });
    const copyBtn = footer.createEl("button", { text: t("copySummary") });
    copyBtn.addEventListener("click", () => {
      void this.copyText(formatPeriodSummaryAsMarkdown(`${label} ${range.start} ~ ${range.end}`, summary, mdStrings()));
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
    [t("thRank"), t("thCat"), t("thDur"), t("thPct")].forEach((th) => thead.createEl("th", { text: th }));
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
    unrec.createEl("td", { text: t("unrecordedRow") });
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
      new Notice(t("copied"));
    } catch (err) {
      new Notice(t("copyFailed") + (err as Error).message);
    }
  }
}
