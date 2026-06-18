import { Plugin, Notice } from "obsidian";
import { TimeRecorderSettings } from "./src/types";
import { DEFAULT_SETTINGS } from "./src/settings";

export default class TimeRecorderPlugin extends Plugin {
  settings!: TimeRecorderSettings;

  async onload() {
    await this.loadSettings();
    console.log("Time Recorder loaded with", this.settings.categories.length, "categories");

    this.addCommand({
      id: "punch-in",
      name: "Punch in",
      callback: () => new Notice(`Categories: ${this.settings.categories.map(c => c.emoji).join(" ")}`),
    });
  }

  async onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
