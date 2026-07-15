import { App, Modal, Notice } from "obsidian";
import { TimeRecorderSettings } from "./types";
import { RecordsFileManager } from "./recordsFile";
import { UndoStack } from "./undoStack";
import { punchIn } from "./punchIn";
import { nowHHMM } from "./time";
import { getTodayDateString } from "./date";
import { showPunchSuccessNotice } from "./openTodayFile";
import { t } from "./i18n";

export class CustomActivityModal extends Modal {
  private activity = "";

  constructor(
    app: App,
    private settings: TimeRecorderSettings,
    private recordsFile: RecordsFileManager,
    private undoStack: UndoStack,
    private onPunched?: () => void,
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("tr-custom-modal");

    contentEl.createEl("h2", { text: t("customTitle") });

    // Activity input
    const row1 = contentEl.createDiv({ cls: "tr-form-row" });
    row1.createEl("label", { text: t("customWhat") });
    const input = row1.createEl("input", {
      type: "text",
      placeholder: t("customPlaceholder"),
    });
    input.addEventListener("input", () => (this.activity = input.value));
    window.setTimeout(() => input.focus(), 50);

    // Buttons
    const buttons = contentEl.createDiv({ cls: "tr-form-buttons" });
    const cancel = buttons.createEl("button", { text: t("cancel") });
    cancel.addEventListener("click", () => this.close());

    const submit = buttons.createEl("button", { text: t("confirmPunch"), cls: "mod-cta" });
    submit.addEventListener("click", () => void this.handleSubmit());

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void this.handleSubmit();
    });
  }

  private async handleSubmit() {
    const activity = this.activity.trim();
    if (activity === "") {
      new Notice(t("emptyActivity"));
      return;
    }
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
      new Notice(t("punchFailed") + (err as Error).message);
      console.error("Punch-in failed", err);
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
