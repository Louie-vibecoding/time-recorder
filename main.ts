import { Plugin } from "obsidian";
import { TimeRecorderSettings } from "./src/types";
import { DEFAULT_SETTINGS } from "./src/settings";
import { createObsidianVaultAdapter, RecordsFileManager } from "./src/recordsFile";
import { UndoStack } from "./src/undoStack";
import { GridModal } from "./src/GridModal";
import { CustomActivityModal } from "./src/CustomActivityModal";
import { StatusIndicator } from "./src/statusBar";

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

    // Ribbon icon
    const ribbon = this.addRibbonIcon("clock", "Time Recorder: Punch in", () => {
      this.openGridModal();
    });
    this.statusIndicator.attachRibbon(ribbon);

    // Status bar
    this.statusIndicator.attachStatusBar();

    // Refresh indicator when records change
    this.registerEvent(
      this.app.vault.on("modify", async () => {
        await this.statusIndicator.refresh();
      }),
    );

    // Command
    this.addCommand({
      id: "punch-in",
      name: "Punch in (open grid)",
      callback: () => this.openGridModal(),
    });
  }

  async onunload() {}

  openGridModal() {
    new GridModal(
      this.app,
      this.settings,
      this.recordsFile,
      this.undoStack,
      () => this.statusIndicator.refresh(),
      () => this.openCustomActivityModal(),
    ).open();
  }

  openCustomActivityModal() {
    new CustomActivityModal(
      this.app,
      this.settings,
      this.recordsFile,
      this.undoStack,
    ).open();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
