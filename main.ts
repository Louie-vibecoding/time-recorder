import { Plugin } from "obsidian";
import { TimeRecorderSettings } from "./src/types";
import { DEFAULT_SETTINGS } from "./src/settings";
import { createObsidianVaultAdapter, RecordsFileManager } from "./src/recordsFile";
import { UndoStack } from "./src/undoStack";
import { GridModal } from "./src/GridModal";
import { CustomActivityModal } from "./src/CustomActivityModal";
import { StatusIndicator } from "./src/statusBar";
import { TodaySummaryView, VIEW_TYPE_TODAY_SUMMARY } from "./src/TodaySummaryView";
import { TimelineView, VIEW_TYPE_TIMELINE } from "./src/TimelineView";
import { getTodayDateString } from "./src/date";

export default class TimeRecorderPlugin extends Plugin {
  settings!: TimeRecorderSettings;
  recordsFile!: RecordsFileManager;
  undoStack!: UndoStack;
  statusIndicator!: StatusIndicator;

  async onload() {
    await this.loadSettings();
    this.recordsFile = new RecordsFileManager(
      createObsidianVaultAdapter(this.app),
      this.settings,
    );
    this.undoStack = new UndoStack();
    this.statusIndicator = new StatusIndicator(this, this.settings, this.recordsFile);

    // 启动时确保今日文件存在，用户可直接打卡（onLayoutReady 避开启动瞬间 UI/IO 竞争）
    this.app.workspace.onLayoutReady(async () => {
      try {
        await this.recordsFile.ensureFileExists(getTodayDateString());
      } catch (err) {
        console.warn("Time Recorder: could not ensure today's file:", err);
      }
    });

    // Ribbon icon
    const ribbon = this.addRibbonIcon("clock", "Time Recorder: Punch in", () => {
      this.openGridModal();
    });
    this.statusIndicator.attachRibbon(ribbon);

    // Ribbon icon for summary view (mobile entry independent of bottom toolbar)
    this.addRibbonIcon("pie-chart", "Time Recorder: Today summary", () => {
      this.activateSummaryView();
    });

    // Ribbon icon for timeline back-fill (mobile entry independent of bottom toolbar)
    this.addRibbonIcon("gantt-chart", "Time Recorder: Open timeline back-fill", () => {
      this.activateTimelineView();
    });

    // Status bar
    this.statusIndicator.attachStatusBar();

    // Command
    this.addCommand({
      id: "punch-in",
      name: "Punch in (open grid)",
      callback: () => this.openGridModal(),
    });

    this.registerView(
      VIEW_TYPE_TODAY_SUMMARY,
      (leaf) => new TodaySummaryView(leaf, this.settings, this.recordsFile),
    );

    this.registerView(
      VIEW_TYPE_TIMELINE,
      (leaf) => new TimelineView(leaf, this.settings, this.recordsFile, () => this.refreshAll()),
    );

    // Single file-watch handler for both status + summary
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (!file.path.startsWith(this.settings.recordsFolder + "/")) return;
        await this.refreshAll();
      }),
    );

    this.addCommand({
      id: "open-today-summary",
      name: "Open today summary",
      callback: () => this.activateSummaryView(),
    });

    this.addCommand({
      id: "open-timeline",
      name: "Open timeline back-fill",
      callback: () => this.activateTimelineView(),
    });
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TODAY_SUMMARY);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TIMELINE);
  }

  async refreshAll(): Promise<void> {
    await this.statusIndicator.refresh();
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TODAY_SUMMARY)) {
      if (leaf.view instanceof TodaySummaryView) {
        await leaf.view.refresh();
      }
    }
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE)) {
      if (leaf.view instanceof TimelineView) {
        await leaf.view.render();
      }
    }
  }

  async activateSummaryView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_TODAY_SUMMARY)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_TODAY_SUMMARY, active: true });
    }
    workspace.revealLeaf(leaf);
    // Refresh
    const view = leaf.view as TodaySummaryView;
    await view.refresh();
  }

  async activateTimelineView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_TIMELINE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_TIMELINE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  openGridModal() {
    new GridModal(
      this.app,
      this.settings,
      this.recordsFile,
      this.undoStack,
      () => this.refreshAll(),
      () => this.openCustomActivityModal(),
      () => this.activateSummaryView(),
      () => this.activateTimelineView(),
    ).open();
  }

  openCustomActivityModal() {
    new CustomActivityModal(
      this.app,
      this.settings,
      this.recordsFile,
      this.undoStack,
      () => this.refreshAll(),
    ).open();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
