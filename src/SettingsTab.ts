import { App, Modal, Notice, PluginSettingTab, Setting, debounce } from "obsidian";
import TimeRecorderPlugin from "../main";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, OTHER_CATEGORY } from "./settings";
import { Category } from "./types";
import { generateCategoryId } from "./idgen";
import { parseAliases, validateCategoryName } from "./settingsValidation";

export class TimeRecorderSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: TimeRecorderPlugin) {
    super(app, plugin);
  }

  // 文本框输入用：停止输入约 0.6s 才落盘+刷新，避免每敲一个字就写 data.json + 全量重渲。
  // resetTimer=true → 每次输入都重置计时（等用户真正停下）。
  private debouncedPersist = debounce(() => {
    void this.persist();
  }, 600, true);

  private async persist(): Promise<void> {
    await this.plugin.saveSettings();
    await this.plugin.refreshAll();
  }

  // 离开设置页时立即把最后一次（可能还在 debounce 窗口内的）改动落盘，防丢。
  // 先取消 pending 的 debounce，避免离开后再多触发一次刷新。
  hide(): void {
    this.debouncedPersist.cancel();
    void this.persist();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ---------- 路径区 ----------
    new Setting(containerEl)
      .setName("记录文件夹")
      .setDesc("时间记录 .md 文件所在文件夹。改此项不会自动搬移已有记录文件（旧文件留原处）。")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.recordsFolder)
          .setValue(this.plugin.settings.recordsFolder)
          .onChange((value) => {
            this.plugin.settings.recordsFolder = value.trim() || DEFAULT_SETTINGS.recordsFolder;
            this.debouncedPersist();
          }),
      );

    new Setting(containerEl)
      .setName("模板路径")
      .setDesc("新建当天记录文件时套用的模板。")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.templatePath)
          .setValue(this.plugin.settings.templatePath)
          .onChange((value) => {
            this.plugin.settings.templatePath = value.trim() || DEFAULT_SETTINGS.templatePath;
            this.debouncedPersist();
          }),
      );

    // ---------- 分类区 ----------
    new Setting(containerEl).setName("分类 / Categories").setHeading();
    const hint = containerEl.createEl("p", {
      text: "活动名自动按「名字 / 关键词」归类。关键词用逗号分隔。改名 / 换 emoji / 删类都不会改动历史记录。",
    });
    hint.addClass("tr-settings-hint");

    this.plugin.settings.categories.forEach((cat, index) => {
      this.renderCategoryRow(containerEl, cat, index);
    });

    // other 兜底类（固定、只读、不可删）
    new Setting(containerEl)
      .setName(`${OTHER_CATEGORY.emoji} ${OTHER_CATEGORY.name}`)
      .setDesc("兜底分类：无法归类的活动都计入这里。固定存在、不可删除、不可配关键词。")
      .settingEl.addClass("tr-other-row");

    // ---------- 操作按钮 ----------
    new Setting(containerEl)
      .addButton((btn) =>
        btn
          .setButtonText("+ 新增分类")
          .setCta()
          .onClick(async () => {
            const id = generateCategoryId("", this.plugin.settings.categories.map((c) => c.id));
            this.plugin.settings.categories.push({ id, name: "", emoji: "", aliases: [] });
            await this.persist();
            this.display();
          }),
      )
      .addButton((btn) =>
        btn
          .setButtonText("恢复默认分类")
          .setWarning()
          .onClick(() => {
            new ConfirmModal(
              this.app,
              "确定用出厂默认分类覆盖当前所有分类？此操作无法撤销。",
              async () => {
                this.plugin.settings.categories = DEFAULT_CATEGORIES.map((c) => ({
                  ...c,
                  aliases: [...c.aliases],
                }));
                await this.persist();
                this.display();
              },
            ).open();
          }),
      );
  }

  private renderCategoryRow(containerEl: HTMLElement, cat: Category, index: number): void {
    const setting = new Setting(containerEl);
    setting.settingEl.addClass("tr-category-row");

    // emoji（窄框）
    setting.addText((text) => {
      text
        .setPlaceholder("❓")
        .setValue(cat.emoji)
        .onChange((value) => {
          this.plugin.settings.categories[index].emoji = value.trim();
          this.debouncedPersist();
        });
      text.inputEl.addClass("tr-emoji-input");
    });

    // 名字（带校验）
    setting.addText((text) =>
      text
        .setPlaceholder("分类名")
        .setValue(cat.name)
        .onChange((value) => {
          const err = validateCategoryName(value, this.plugin.settings.categories, index);
          if (err) {
            new Notice(err);
            return;
          }
          this.plugin.settings.categories[index].name = value.trim();
          this.debouncedPersist();
        }),
    );

    // 关键词（逗号分隔）
    setting.addText((text) => {
      text
        .setPlaceholder("关键词，逗号分隔")
        .setValue(cat.aliases.join(", "))
        .onChange((value) => {
          this.plugin.settings.categories[index].aliases = parseAliases(value);
          this.debouncedPersist();
        });
      text.inputEl.addClass("tr-alias-input");
    });

    // 删除
    setting.addExtraButton((btn) =>
      btn
        .setIcon("trash")
        .setTooltip("删除此分类")
        .onClick(async () => {
          this.plugin.settings.categories.splice(index, 1);
          await this.persist();
          this.display();
        }),
    );
  }
}

/** 跨端安全的二次确认弹窗（不用 window.confirm，Android webview 友好）。 */
class ConfirmModal extends Modal {
  constructor(
    app: App,
    private message: string,
    private onConfirm: () => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("确定")
          .setWarning()
          .onClick(async () => {
            this.close();
            await this.onConfirm();
          }),
      )
      .addButton((btn) =>
        btn.setButtonText("取消").onClick(() => this.close()),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
