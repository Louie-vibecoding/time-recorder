import { Plugin } from "obsidian";
import { RecordsFileManager } from "./recordsFile";
import { TimeRecorderSettings } from "./types";
import { nowHHMM, minutesDiff, formatDuration, isOpenEnd } from "./time";
import { getTodayDateString } from "./date";

export class StatusIndicator {
  private statusEl?: HTMLElement;
  private intervalId?: number;
  private ribbonEl?: HTMLElement;

  constructor(
    private plugin: Plugin,
    private settings: TimeRecorderSettings,
    private recordsFile: RecordsFileManager,
  ) {}

  attachStatusBar(): void {
    this.statusEl = this.plugin.addStatusBarItem();
    this.statusEl.addClass("tr-status");
    void this.refresh();
    this.intervalId = window.setInterval(() => void this.refresh(), 30_000);
    this.plugin.registerInterval(this.intervalId);
  }

  attachRibbon(ribbon: HTMLElement): void {
    this.ribbonEl = ribbon;
    void this.refresh();
  }

  async refresh(): Promise<void> {
    const today = getTodayDateString();
    const day = await this.recordsFile.readDayRecord(today).catch(() => null);
    const open = day?.segments.find(s => isOpenEnd(s.end));
    let text = "⏱ 未开始";
    if (open) {
      const cat = this.settings.categories.find(c => c.id === open.categoryId);
      const emoji = cat?.emoji ?? "❓";
      const dur = formatDuration(minutesDiff(open.start, nowHHMM()));
      text = `${emoji} ${open.activity} · ${dur}`;
    }
    if (this.statusEl) this.statusEl.setText(text);
    if (this.ribbonEl) this.ribbonEl.setAttribute("aria-label", text);
  }
}
