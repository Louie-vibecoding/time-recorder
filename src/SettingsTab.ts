import { App, Modal, Notice, PluginSettingTab, Setting, debounce } from "obsidian";
import TimeRecorderPlugin from "../main";
import {
  defaultCategoriesForRestore,
  defaultSettingsFor,
  followCategoriesToLang,
  OTHER_CATEGORY,
} from "./settings";
import { Category, LanguageSetting } from "./types";
import { generateCategoryId } from "./idgen";
import { parseAliases, validateCategoryName } from "./settingsValidation";
import { t, getLang, setLangOverride, format, categoryNameMessages, LANG_NAMES } from "./i18n";

export class TimeRecorderSettingsTab extends PluginSettingTab {
  // 会话级：切语言后分类被保留（用户自定义过）时，在分类区显示一次引导提示。
  private showLangCatHint = false;

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

  /**
   * 切换界面语言。绕开 debounce（避免落盘与整页重画竞争）：
   * 1. 写入偏好并让 override 立即生效（此后所有 t() 用新语言）。
   * 2. 分类逐条跟随（followCategoriesToLang）：未修改过的默认分类替换为目标
   *    语言版（含关键词桥接，可逆零损失）；用户新增/修改过的条目原样保留，
   *    语言实际变化且存在保留条目时显示一次说明提示。
   * 3. persist（落盘 + 状态栏/已开视图刷新）后整页重画。
   * recordsFolder / templatePath / flashNotePath / 数据层格式在本路径零写入。
   */
  private async applyLanguage(lang: LanguageSetting): Promise<void> {
    const before = getLang();
    this.plugin.settings.language = lang;
    setLangOverride(lang === "auto" ? null : lang);
    const target = getLang();
    const result = followCategoriesToLang(this.plugin.settings.categories, target);
    if (result.changed) {
      this.plugin.settings.categories = result.categories;
      new Notice(format(t("catsFollowedLang"), { lang: LANG_NAMES[target] }));
    }
    this.showLangCatHint = before !== target && result.keptCount > 0;
    await this.persist();
    this.display();
  }

  // 离开设置页时立即把最后一次（可能还在 debounce 窗口内的）改动落盘，防丢。
  // 先取消 pending 的 debounce，避免离开后再多触发一次刷新。
  // 语言提示是会话级的：关掉设置页即失效（SettingsTab 实例是插件级单例，必须在此重置）。
  hide(): void {
    this.debouncedPersist.cancel();
    void this.persist();
    this.showLangCatHint = false;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    // 语言相关默认值（仅作占位符提示；用户已保存的值不受影响）
    const langDefaults = defaultSettingsFor(getLang());

    // ---------- 界面语言 ----------
    new Setting(containerEl)
      .setName(t("setLangName"))
      .setDesc(t("setLangDesc"))
      .addDropdown((dd) => {
        dd.addOption("auto", t("langAuto"));
        for (const [code, name] of Object.entries(LANG_NAMES)) {
          dd.addOption(code, name);
        }
        dd.setValue(this.plugin.settings.language).onChange(async (value) => {
          await this.applyLanguage(value as LanguageSetting);
        });
      });

    // ---------- 路径区 ----------
    // 清空输入框 = 保留上次已保存的值（绝不按语言默认回填路径——
    // 否则切过语言的老用户误清空后，记录文件夹会被指到不存在的默认路径，历史记录“失踪”）。
    new Setting(containerEl)
      .setName(t("setFolderName"))
      .setDesc(t("setFolderDesc"))
      .addText((text) =>
        text
          .setPlaceholder(langDefaults.recordsFolder)
          .setValue(this.plugin.settings.recordsFolder)
          .onChange((value) => {
            const v = value.trim();
            if (v) this.plugin.settings.recordsFolder = v;
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
            const v = value.trim();
            if (v) this.plugin.settings.templatePath = v;
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

    // 切语言后分类被保留时的一次性引导（会话级，不落盘、关掉设置页即消失）
    if (this.showLangCatHint) {
      const langHint = containerEl.createEl("p", { text: t("langCatHint") });
      langHint.addClass("tr-settings-hint");
      langHint.addClass("tr-lang-cat-hint");
    }

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
                this.showLangCatHint = false;
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
