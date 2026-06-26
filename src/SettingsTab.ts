import { App, PluginSettingTab, Setting } from "obsidian";
import TimeRecorderPlugin from "../main";

export class TimeRecorderSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: TimeRecorderPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Time Recorder 设置 / Settings" });

    new Setting(containerEl)
      .setName("记录文件夹")
      .setDesc(this.plugin.settings.recordsFolder || "(未设置)");

    new Setting(containerEl)
      .setName("模板路径")
      .setDesc(this.plugin.settings.templatePath || "(未设置)");

    containerEl.createEl("h3", { text: "分类" });

    const note = containerEl.createEl("p", {
      text:
        "1.0 暂无分类编辑界面。要增删改分类，请编辑插件目录下 src/settings.ts 的 DEFAULT_CATEGORIES 后重新 build 并重载 Obsidian（不要改 data.json）。",
    });
    note.style.color = "var(--text-muted)";

    const list = containerEl.createEl("ul");
    for (const c of this.plugin.settings.categories) {
      list.createEl("li", { text: `${c.emoji} ${c.name} (id: ${c.id})` });
    }
  }
}
