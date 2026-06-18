import { Plugin, Notice } from "obsidian";

export default class TimeRecorderPlugin extends Plugin {
  async onload() {
    console.log("Time Recorder loaded");
    new Notice("Time Recorder loaded ✅");

    this.addCommand({
      id: "punch-in",
      name: "Punch in",
      callback: () => new Notice("Punch in clicked"),
    });
  }

  async onunload() {
    console.log("Time Recorder unloaded");
  }
}
