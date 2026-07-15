import { App, Modal, Notice } from "obsidian";
import { TimeRecorderSettings, Segment } from "./types";
import { RecordsFileManager } from "./recordsFile";
import { formatSegmentLine, replaceLine, appendLine } from "./parser";
import { inferCategoryId } from "./categoryInfer";
import { validateSegmentTimes } from "./segmentEdit";
import { t, segmentTimeMessages } from "./i18n";

export type EditorMode =
  | { kind: "new"; start: string; end: string }
  | { kind: "edit"; segment: Segment };

export class SegmentEditorModal extends Modal {
  private start: string;
  private end: string;
  private activity: string;

  constructor(
    app: App,
    private settings: TimeRecorderSettings,
    private recordsFile: RecordsFileManager,
    private date: string,
    private mode: EditorMode,
    private onSaved?: () => void,
  ) {
    super(app);
    if (mode.kind === "new") {
      this.start = mode.start;
      this.end = mode.end;
      this.activity = "";
    } else {
      this.start = mode.segment.start;
      this.end = mode.segment.end;
      this.activity = mode.segment.activity;
    }
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("tr-editor-modal");

    contentEl.createEl("h2", {
      text: this.mode.kind === "new" ? t("segTitleNew") : t("segTitleEdit"),
    });

    const startRow = contentEl.createDiv({ cls: "tr-form-row" });
    startRow.createEl("label", { text: t("segStart") });
    const startInput = startRow.createEl("input", { type: "time", value: this.start });
    startInput.addEventListener("input", () => (this.start = startInput.value));

    const endRow = contentEl.createDiv({ cls: "tr-form-row" });
    endRow.createEl("label", { text: t("segEnd") });
    const endInput = endRow.createEl("input", { type: "time", value: this.end });
    endInput.addEventListener("input", () => (this.end = endInput.value));

    const actRow = contentEl.createDiv({ cls: "tr-form-row" });
    actRow.createEl("label", {
      text: t("segDesc"),
    });
    const actInput = actRow.createEl("input", { type: "text", value: this.activity });
    actInput.addEventListener("input", () => (this.activity = actInput.value));

    const buttons = contentEl.createDiv({ cls: "tr-form-buttons" });
    if (this.mode.kind === "edit") {
      const delBtn = buttons.createEl("button", { text: t("segDelete"), cls: "mod-warning" });
      delBtn.addEventListener("click", () => void this.handleDelete());
    }
    const cancel = buttons.createEl("button", { text: t("cancel") });
    cancel.addEventListener("click", () => this.close());

    const saveBtn = buttons.createEl("button", { text: t("segSave"), cls: "mod-cta" });
    saveBtn.addEventListener("click", () => void this.handleSave());
  }

  private async handleSave() {
    const validation = validateSegmentTimes(this.start, this.end, segmentTimeMessages());
    if (!validation.ok) {
      new Notice(validation.error ?? t("segInvalidTime"));
      return;
    }
    const finalEnd = validation.normalizedEnd!; // "ing"（进行中）或有效 "HH:MM"
    const inProgress = finalEnd === "ing";

    const activityText = this.activity.trim() || t("segUnnamed");
    const newSegment: Segment = {
      start: this.start,
      end: finalEnd,
      activity: activityText,
      categoryId: inferCategoryId(activityText, this.settings.categories),
      lineNumber: this.mode.kind === "edit" ? this.mode.segment.lineNumber : -1,
    };

    try {
      const before = await this.recordsFile.readDayContent(this.date);
      const after =
        this.mode.kind === "edit"
          ? replaceLine(before, this.mode.segment.lineNumber, formatSegmentLine(newSegment))
          : appendLine(before, formatSegmentLine(newSegment));
      await this.recordsFile.writeDayContent(this.date, after);
      new Notice(
        this.mode.kind === "edit"
          ? (inProgress ? t("segUpdatedIng") : t("segUpdatedDone"))
          : (inProgress ? t("segCreatedIng") : t("segCreatedDone")),
      );
      this.close();
      this.onSaved?.();
    } catch (err) {
      new Notice(t("saveFailed") + (err as Error).message);
      console.error("Save segment failed", err);
    }
  }

  private async handleDelete() {
    if (this.mode.kind !== "edit") return;
    try {
      const before = await this.recordsFile.readDayContent(this.date);
      // 删除 = 把该行替换为空串（保留行号不错位），下次封口/解析会跳过空行
      const after = replaceLine(before, this.mode.segment.lineNumber, "");
      await this.recordsFile.writeDayContent(this.date, after);
      new Notice(t("deleted"));
      this.close();
      this.onSaved?.();
    } catch (err) {
      new Notice(t("deleteFailed") + (err as Error).message);
      console.error("Delete segment failed", err);
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
