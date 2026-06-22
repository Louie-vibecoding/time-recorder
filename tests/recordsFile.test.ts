import { describe, it, expect, beforeEach } from "vitest";
import { RecordsFileManager } from "../src/recordsFile";
import { DEFAULT_CATEGORIES } from "../src/settings";

/** Minimal mock of Obsidian's Vault. */
class MockVault {
  files = new Map<string, string>();
  async exists(path: string) {
    return this.files.has(path);
  }
  async read(path: string) {
    return this.files.get(path) ?? "";
  }
  async write(path: string, content: string) {
    this.files.set(path, content);
  }
  async createFolder(_path: string) {
    /* noop */
  }
}

describe("RecordsFileManager", () => {
  let vault: MockVault;
  let mgr: RecordsFileManager;

  beforeEach(() => {
    vault = new MockVault();
    mgr = new RecordsFileManager(vault as any, {
      recordsFolder: "tr",
      templatePath: "tr/template.md",
      categories: DEFAULT_CATEGORIES,
      version: 1,
    });
  });

  it("creates file from template if missing", async () => {
    vault.files.set("tr/template.md", "- [ ] 00:00 - 00:00 \n");
    await mgr.ensureFileExists("2026-6-17");
    expect(await vault.exists("tr/2026-6-17 时间记录.md")).toBe(true);
  });

  it("uses empty content if no template", async () => {
    await mgr.ensureFileExists("2026-6-17");
    const content = await vault.read("tr/2026-6-17 时间记录.md");
    expect(content).toBe("");
  });

  it("reads and parses a day record", async () => {
    vault.files.set("tr/2026-6-17 时间记录.md", "- [ ] 08:30 - 10:00 学习\n");
    const day = await mgr.readDayRecord("2026-6-17");
    expect(day.segments.length).toBe(1);
    expect(day.segments[0].activity).toBe("学习");
  });

  it("writes raw content to a day file", async () => {
    await mgr.writeDayContent("2026-6-17", "new content\n");
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toBe("new content\n");
  });

  it("getDayFilePath returns the right path", () => {
    expect(mgr.getDayFilePath("2026-6-17")).toBe("tr/2026-6-17 时间记录.md");
  });

  it("readDayContent returns empty string for a missing file", async () => {
    expect(await mgr.readDayContent("2026-6-17")).toBe("");
  });

  it("readDayRecord returns no segments for a missing file", async () => {
    const day = await mgr.readDayRecord("2026-6-17");
    expect(day.segments.length).toBe(0);
    expect(day.filePath).toBe("tr/2026-6-17 时间记录.md");
    expect(day.date).toBe("2026-6-17");
  });
});
