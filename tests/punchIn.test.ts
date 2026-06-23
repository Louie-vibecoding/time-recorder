import { describe, it, expect, beforeEach } from "vitest";
import { punchIn, undoLast } from "../src/punchIn";
import { RecordsFileManager } from "../src/recordsFile";
import { UndoStack } from "../src/undoStack";
import { DEFAULT_CATEGORIES } from "../src/settings";

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
  async createFolder() {}
}

describe("punchIn", () => {
  let vault: MockVault;
  let mgr: RecordsFileManager;
  let undo: UndoStack;

  beforeEach(() => {
    vault = new MockVault();
    mgr = new RecordsFileManager(vault as any, {
      recordsFolder: "tr",
      templatePath: "tr/template.md",
      categories: DEFAULT_CATEGORIES,
      version: 1,
    });
    undo = new UndoStack();
  });

  it("appends a new open segment when no prior segments exist", async () => {
    await punchIn(mgr, undo, {
      date: "2026-6-17",
      activity: "学习",
      now: "16:05",
    });
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toBe("- [ ] 16:05 - 00:00 学习\n");
  });

  it("closes the previous open segment and appends new", async () => {
    vault.files.set(
      "tr/2026-6-17 时间记录.md",
      "- [ ] 14:30 - 00:00 通勤\n",
    );
    await punchIn(mgr, undo, {
      date: "2026-6-17",
      activity: "学习",
      now: "16:05",
    });
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toBe(
      "- [ ] 14:30 - 16:05 通勤\n- [ ] 16:05 - 00:00 学习\n",
    );
  });

  it("does not close an already-closed segment", async () => {
    vault.files.set(
      "tr/2026-6-17 时间记录.md",
      "- [ ] 14:30 - 15:30 通勤\n",
    );
    await punchIn(mgr, undo, {
      date: "2026-6-17",
      activity: "学习",
      now: "16:05",
    });
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toBe(
      "- [ ] 14:30 - 15:30 通勤\n- [ ] 16:05 - 00:00 学习\n",
    );
  });

  it("pushes an undo entry", async () => {
    await punchIn(mgr, undo, {
      date: "2026-6-17",
      activity: "学习",
      now: "16:05",
    });
    expect(undo.size()).toBe(1);
    expect(undo.peek()?.description).toContain("学习");
  });

  it("preserves non-segment lines (template empty rows, headings)", async () => {
    vault.files.set(
      "tr/2026-6-17 时间记录.md",
      "# Day\n- [ ] 00:00 - 00:00 \n- [ ] 14:30 - 00:00 通勤\n",
    );
    await punchIn(mgr, undo, {
      date: "2026-6-17",
      activity: "学习",
      now: "16:05",
    });
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toBe(
      "# Day\n- [ ] 00:00 - 00:00 \n- [ ] 14:30 - 16:05 通勤\n- [ ] 16:05 - 00:00 学习\n",
    );
  });
});

describe("undoLast", () => {
  let vault: MockVault;
  let mgr: RecordsFileManager;
  let undo: UndoStack;

  beforeEach(() => {
    vault = new MockVault();
    mgr = new RecordsFileManager(vault as any, {
      recordsFolder: "tr",
      templatePath: "tr/template.md",
      categories: DEFAULT_CATEGORIES,
      version: 1,
    });
    undo = new UndoStack();
  });

  it("restores the file to its exact prior state after a punch-in", async () => {
    vault.files.set(
      "tr/2026-6-17 时间记录.md",
      "- [ ] 14:30 - 00:00 通勤\n",
    );
    await punchIn(mgr, undo, {
      date: "2026-6-17",
      activity: "学习",
      now: "16:05",
    });
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toContain("16:05");
    expect(await undoLast(mgr, undo)).toBe(true);
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toBe(
      "- [ ] 14:30 - 00:00 通勤\n",
    );
  });

  it("round-trips an empty starting file back to empty", async () => {
    await punchIn(mgr, undo, {
      date: "2026-6-17",
      activity: "学习",
      now: "16:05",
    });
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toBe(
      "- [ ] 16:05 - 00:00 学习\n",
    );
    expect(await undoLast(mgr, undo)).toBe(true);
    expect(await vault.read("tr/2026-6-17 时间记录.md")).toBe("");
  });

  it("returns false when there is nothing to undo", async () => {
    expect(await undoLast(mgr, undo)).toBe(false);
  });
});
