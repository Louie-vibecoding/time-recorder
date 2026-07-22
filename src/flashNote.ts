import { App, FuzzySuggestModal, MarkdownView, Notice, TFile, normalizePath } from "obsidian";
import type TimeRecorderPlugin from "../main";
import { t, format } from "./i18n";

/**
 * 闪记：一键跳到常用笔记的末尾接着写（光标落到最后一行行尾并聚焦）。
 * 未配置目标或目标已不存在 → 弹出文件选择器，选中即保存并跳转——
 * 引导即配置，不需要先去设置页。
 */
export async function openFlashNote(app: App, plugin: TimeRecorderPlugin): Promise<void> {
  const path = plugin.settings.flashNotePath.trim();
  if (!path) {
    new FlashTargetSuggestModal(app, plugin).open();
    return;
  }
  const file = app.vault.getAbstractFileByPath(normalizePath(path));
  if (!(file instanceof TFile)) {
    new Notice(format(t("flashTargetMissing"), { path }));
    new FlashTargetSuggestModal(app, plugin).open();
    return;
  }
  await openAtEnd(app, file);
}

/** 打开文件并把光标定位到末尾。阅读模式先切回编辑模式——闪记的目的就是马上写。 */
async function openAtEnd(app: App, file: TFile): Promise<void> {
  try {
    await app.workspace.getLeaf(false).openFile(file);
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || view.file?.path !== file.path) return;
    if (view.getMode() === "preview") {
      await view.setState({ ...view.getState(), mode: "source" }, { history: false });
    }
    const editor = view.editor;
    const line = editor.lastLine();
    const pos = { line, ch: editor.getLine(line).length };
    editor.setCursor(pos);
    editor.scrollIntoView({ from: pos, to: pos }, true);
    editor.focus();
  } catch (err) {
    new Notice(t("flashOpenFailed") + (err as Error).message);
    console.error("Open flash note failed", err);
  }
}

/** 闪记目标选择器：全库 .md 按最近修改排序，选中即写入设置并立刻跳转。 */
class FlashTargetSuggestModal extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private plugin: TimeRecorderPlugin,
  ) {
    super(app);
    this.setPlaceholder(t("flashPickerPlaceholder"));
  }

  getItems(): TFile[] {
    return this.app.vault.getMarkdownFiles().sort((a, b) => b.stat.mtime - a.stat.mtime);
  }

  getItemText(file: TFile): string {
    return file.path;
  }

  onChooseItem(file: TFile): void {
    void this.saveAndJump(file);
  }

  private async saveAndJump(file: TFile): Promise<void> {
    this.plugin.settings.flashNotePath = file.path;
    await this.plugin.saveSettings();
    new Notice(format(t("flashTargetSaved"), { path: file.path }));
    await openAtEnd(this.app, file);
  }
}
