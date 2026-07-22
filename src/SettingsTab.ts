import { App, Modal, Notice, PluginSettingTab, Setting, debounce } from "obsidian";
import TimeRecorderPlugin from "../main";
import { defaultCategoriesForRestore, defaultSettingsFor, OTHER_CATEGORY } from "./settings";
import { Category } from "./types";
import { generateCategoryId } from "./idgen";
import { parseAliases, validateCategoryName } from "./settingsValidation";
import { t, getLang, categoryNameMessages } from "./i18n";

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
    // 语言相关默认值（占位符/回退值随界面语言走；用户已保存的值不受影响）
    const langDefaults = defaultSettingsFor(getLang());

    // ---------- 路径区 ----------
    new Setting(containerEl)
      .setName(t("setFolderName"))
      .setDesc(t("setFolderDesc"))
      .addText((text) =>
        text
          .setPlaceholder(langDefaults.recordsFolder)
          .setValue(this.plugin.settings.recordsFolder)
          .onChange((value) => {
            this.plugin.settings.recordsFolder = value.trim() || langDefaults.recordsFolder;
            this.debouncedPersist();
          }),
      );

    new Setting(containerEl)
      .setName(t("setTemplateName"))
      .setDesc(t("setTemplateDesc"))
      .addText((text) =>
        text
          .setPlaceholder(langDefaults.templatePath)
          .setValue(this.plugin.settings.templatePath)
          .onChange((value) => {
            this.plugin.settings.templatePath = value.trim() || langDefaults.templatePath;
            this.debouncedPersist();
          }),
      );

    // 闪记目标：空串合法（= 未配置，点击「闪记」时弹选择器），不回填默认值
    new Setting(containerEl)
      .setName(t("setFlashName"))
      .setDesc(t("setFlashDesc"))
      .addText((text) =>
        text
          .setPlaceholder(t("setFlashPh"))
          .setValue(this.plugin.settings.flashNotePath)
          .onChange((value) => {
            this.plugin.settings.flashNotePath = value.trim();
            this.debouncedPersist();
          }),
      );

    // ---------- 分类区 ----------
    new Setting(containerEl).setName(t("setCatHeading")).setHeading();
    const hint = containerEl.createEl("p", {
      text: t("setCatHint"),
    });
    hint.addClass("tr-settings-hint");

    this.plugin.settings.categories.forEach((cat, index) => {
      this.renderCategoryRow(containerEl, cat, index);
    });

    // other 兜底类（固定、只读、不可删）
    new Setting(containerEl)
      .setName(`${OTHER_CATEGORY.emoji} ${t("otherName")}`)
      .setDesc(t("otherDesc"))
      .settingEl.addClass("tr-other-row");

    // ---------- 操作按钮 ----------
    new Setting(containerEl)
      .addButton((btn) =>
        btn
          .setButtonText(t("addCat"))
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
          .setButtonText(t("resetCats"))
          .setWarning()
          .onClick(() => {
            new ConfirmModal(
              this.app,
              t("resetConfirm"),
              async () => {
                this.plugin.settings.categories = defaultCategoriesForRestore(getLang());
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
        .setPlaceholder(t("catNamePh"))
        .setValue(cat.name)
        .onChange((value) => {
          const err = validateCategoryName(value, this.plugin.settings.categories, index, categoryNameMessages());
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
        .setPlaceholder(t("aliasPh"))
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
        .setTooltip(t("delCatTip"))
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
          .setButtonText(t("ok"))
          .setWarning()
          .onClick(async () => {
            this.close();
            await this.onConfirm();
          }),
      )
      .addButton((btn) =>
        btn.setButtonText(t("cancel")).onClick(() => this.close()),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
