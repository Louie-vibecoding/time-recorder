import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { TimeRecorderSettings } from "./src/types";
import { migrateSettings } from "./src/settingsMigration";
import { createObsidianVaultAdapter, RecordsFileManager } from "./src/recordsFile";
import { UndoStack } from "./src/undoStack";
import { GridModal } from "./src/GridModal";
import { CustomActivityModal } from "./src/CustomActivityModal";
import { StatusIndicator } from "./src/statusBar";
import { TodaySummaryView, VIEW_TYPE_TODAY_SUMMARY } from "./src/TodaySummaryView";
import { TimelineView, VIEW_TYPE_TIMELINE } from "./src/TimelineView";
import { getTodayDateString } from "./src/date";
import { TimeRecorderSettingsTab } from "./src/SettingsTab";
import { splitDuplicateLeaves } from "./src/leafDedup";

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

    // 启动时收敛重复视图：Obsidian 会恢复持久化的自定义视图 leaf，历史遗留的重复
    // leaf 也随之被恢复出来（表现为“两个今日汇总/时间轴”）。等布局恢复完成后，
    // 每种类型只留第一个、detach 其余——不依赖用户手动点 ribbon 才自愈（根治重复视图）。
    this.app.workspace.onLayoutReady(() => this.dedupeAllViews());

    // Ribbon icon
    const ribbon = this.addRibbonIcon("clock", "Time Recorder: Punch in", () => {
      this.openGridModal();
    });
    this.statusIndicator.attachRibbon(ribbon);

    // Ribbon icon for summary view (mobile entry independent of bottom toolbar)
    this.addRibbonIcon("pie-chart", "Time Recorder: Summary", () => {
      void this.activateSummaryView();
    });

    // Ribbon icon for timeline back-fill (mobile entry independent of bottom toolbar)
    this.addRibbonIcon("gantt-chart", "Time Recorder: Open timeline back-fill", () => {
      void this.activateTimelineView();
    });

    // Status bar
    this.statusIndicator.attachStatusBar();

    // Settings tab (editable categories / paths)
    this.addSettingTab(new TimeRecorderSettingsTab(this.app, this));

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
      (leaf) => new TimelineView(leaf, this.settings, this.recordsFile, () => void this.refreshAll()),
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
      name: "Open summary",
      callback: () => void this.activateSummaryView(),
    });

    this.addCommand({
      id: "open-timeline",
      name: "Open timeline back-fill",
      callback: () => void this.activateTimelineView(),
    });
  }

  onunload() {
    // 故意不在此 detach 自定义视图：Obsidian 在插件卸载时会自动清理已注册视图的 leaf。
    // 手动 detach 是官方反模式，会与启动时的布局恢复竞争、可能造成重复视图。
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

  /**
   * 某类型自定义视图去重：保留第一个 leaf、detach 其余。返回保留的 leaf（无则 undefined）。
   * 启动去重与用户激活共用同一逻辑，保证“任何时候都只剩一个”。
   */
  private dedupeLeaves(viewType: string): WorkspaceLeaf | undefined {
    const { keep, extras } = splitDuplicateLeaves(
      this.app.workspace.getLeavesOfType(viewType),
    );
    for (const leaf of extras) leaf.detach();
    return keep ?? undefined;
  }

  /** 启动时收敛所有自定义视图的重复 leaf。 */
  private dedupeAllViews(): void {
    this.dedupeLeaves(VIEW_TYPE_TODAY_SUMMARY);
    this.dedupeLeaves(VIEW_TYPE_TIMELINE);
  }

  async activateSummaryView() {
    const { workspace } = this.app;
    let leaf = this.dedupeLeaves(VIEW_TYPE_TODAY_SUMMARY);
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_TODAY_SUMMARY, active: true });
    }
    await workspace.revealLeaf(leaf);
    // Refresh（instanceof 守卫：deferred 视图的 view 可能尚未实例化）
    if (leaf.view instanceof TodaySummaryView) {
      await leaf.view.refresh();
    }
  }

  async activateTimelineView() {
    const { workspace } = this.app;
    let leaf = this.dedupeLeaves(VIEW_TYPE_TIMELINE);
    if (!leaf) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_TIMELINE, active: true });
    }
    await workspace.revealLeaf(leaf);
  }

  openGridModal() {
    new GridModal(
      this.app,
      this.settings,
      this.recordsFile,
      this.undoStack,
      () => void this.refreshAll(),
      () => this.openCustomActivityModal(),
      () => void this.activateSummaryView(),
      () => void this.activateTimelineView(),
    ).open();
  }

  openCustomActivityModal() {
    new CustomActivityModal(
      this.app,
      this.settings,
      this.recordsFile,
      this.undoStack,
      () => void this.refreshAll(),
    ).open();
  }

  async loadSettings() {
    let loaded: unknown = null;
    let loadFailed = false;
    try {
      loaded = await this.loadData();
    } catch {
      // data.json 存在但 JSON 解析失败。
      loadFailed = true;
    }
    const { settings, recovered } = migrateSettings(loaded);
    this.settings = settings;
    if (recovered || loadFailed) {
      await this.backupCorruptSettings();
      new Notice(
        "⏱️ 时间记录仪：你的设置文件好像出了点小问题，已经先用默认设置顶上了。原来的设置我自动留了备份、没丢，需要的话能帮你找回。",
        0, // 0 = 常驻直到点击关闭，确保用户看到
      );
    }
  }

  /** 把损坏的 data.json 复制成 data.json.bak（不删原数据）。尽力而为、永不阻塞加载。 */
  private async backupCorruptSettings() {
    try {
      const dir = this.manifest.dir;
      if (!dir) return;
      const dataPath = `${dir}/data.json`;
      const bakPath = `${dir}/data.json.bak`;
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(dataPath)) {
        const raw = await adapter.read(dataPath);
        await adapter.write(bakPath, raw);
      }
    } catch {
      // 备份失败也不影响插件正常加载（默认设置已就位）。
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
