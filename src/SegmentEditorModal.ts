import { App, Modal, Notice } from "obsidian";
import { TimeRecorderSettings, Segment } from "./types";
import { RecordsFileManager } from "./recordsFile";
import { formatSegmentLine, replaceLine, appendLine } from "./parser";
import { inferCategoryId } from "./categoryInfer";
import { validateSegmentTimes } from "./segmentEdit";

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
      text: this.mode.kind === "new" ? "新建时间段" : "编辑时间段",
    });

    const startRow = contentEl.createDiv({ cls: "tr-form-row" });
    startRow.createEl("label", { text: "开始" });
    const startInput = startRow.createEl("input", { type: "time", value: this.start });
    startInput.addEventListener("input", () => (this.start = startInput.value));

    const endRow = contentEl.createDiv({ cls: "tr-form-row" });
    endRow.createEl("label", { text: "结束（留空 = 进行中）" });
    const endInput = endRow.createEl("input", { type: "time", value: this.end });
    endInput.addEventListener("input", () => (this.end = endInput.value));

    const actRow = contentEl.createDiv({ cls: "tr-form-row" });
    actRow.createEl("label", {
      text: "描述（可留空，留空记为「未命名」；分类按描述自动判断）",
    });
    const actInput = actRow.createEl("input", { type: "text", value: this.activity });
    actInput.addEventListener("input", () => (this.activity = actInput.value));

    const buttons = contentEl.createDiv({ cls: "tr-form-buttons" });
    if (this.mode.kind === "edit") {
      const delBtn = buttons.createEl("button", { text: "删除", cls: "mod-warning" });
      delBtn.addEventListener("click", () => this.handleDelete());
    }
    const cancel = buttons.createEl("button", { text: "取消" });
    cancel.addEventListener("click", () => this.close());

    const saveBtn = buttons.createEl("button", { text: "保存", cls: "mod-cta" });
    saveBtn.addEventListener("click", () => this.handleSave());
  }

  private async handleSave() {
    const validation = validateSegmentTimes(this.start, this.end);
    if (!validation.ok) {
      new Notice(validation.error ?? "时间无效");
      return;
    }
    const finalEnd = validation.normalizedEnd!; // "ing"（进行中）或有效 "HH:MM"
    const inProgress = finalEnd === "ing";

    const activityText = this.activity.trim() || "未命名";
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
      const verb = this.mode.kind === "edit" ? "已更新" : "已新建";
      new Notice(inProgress ? `${verb}（进行中）✅` : `${verb} ✅`);
      this.close();
      this.onSaved?.();
    } catch (err) {
      new Notice(`保存失败：${(err as Error).message}`);
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
      new Notice("已删除 ✅");
      this.close();
      this.onSaved?.();
    } catch (err) {
      new Notice(`删除失败：${(err as Error).message}`);
      console.error("Delete segment failed", err);
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
