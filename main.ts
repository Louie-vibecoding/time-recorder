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

  async activateSummaryView() {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_TODAY_SUMMARY);
    let leaf: WorkspaceLeaf;
    if (leaves.length > 0) {
      // 复用第一个；关掉竞态/布局恢复可能残留的重复 leaf（自愈）
      leaf = leaves[0];
      for (let i = 1; i < leaves.length; i++) leaves[i].detach();
    } else {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_TODAY_SUMMARY, active: true });
    }
    workspace.revealLeaf(leaf);
    // Refresh（instanceof 守卫：deferred 视图的 view 可能尚未实例化）
    if (leaf.view instanceof TodaySummaryView) {
      await leaf.view.refresh();
    }
  }

  async activateTimelineView() {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_TIMELINE);
    let leaf: WorkspaceLeaf;
    if (leaves.length > 0) {
      // 复用第一个；关掉残留的重复 leaf（自愈）
      leaf = leaves[0];
      for (let i = 1; i < leaves.length; i++) leaves[i].detach();
    } else {
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
    let loaded: unknown = null;
    let loadFailed = false;
    try {
      loaded = await this.loadData();
    } catch (e) {
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
    } catch (e) {
      // 备份失败也不影响插件正常加载（默认设置已就位）。
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
