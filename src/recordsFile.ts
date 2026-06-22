import { DayRecord, TimeRecorderSettings } from "./types";
import { parseDayContent } from "./parser";
import { getDateFilename } from "./date";

/** Thin abstraction over Obsidian's Vault adapter for testability. */
export interface VaultLike {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  createFolder(path: string): Promise<void>;
}

export class RecordsFileManager {
  constructor(
    private vault: VaultLike,
    private settings: TimeRecorderSettings,
  ) {}

  getDayFilePath(date: string): string {
    return `${this.settings.recordsFolder}/${getDateFilename(date)}`;
  }

  async ensureFileExists(date: string): Promise<void> {
    const filePath = this.getDayFilePath(date);
    if (await this.vault.exists(filePath)) return;

    // Ensure parent folder exists (idempotent)
    try {
      await this.vault.createFolder(this.settings.recordsFolder);
    } catch {
      /* already exists — fine */
    }

    let templateContent = "";
    if (await this.vault.exists(this.settings.templatePath)) {
      templateContent = await this.vault.read(this.settings.templatePath);
    }
    await this.vault.write(filePath, templateContent);
  }

  async readDayRecord(date: string): Promise<DayRecord> {
    const filePath = this.getDayFilePath(date);
    const content = (await this.vault.exists(filePath))
      ? await this.vault.read(filePath)
      : "";
    return {
      date,
      filePath,
      segments: parseDayContent(content, this.settings.categories),
    };
  }

  async readDayContent(date: string): Promise<string> {
    const filePath = this.getDayFilePath(date);
    if (!(await this.vault.exists(filePath))) return "";
    return this.vault.read(filePath);
  }

  async writeDayContent(date: string, content: string): Promise<void> {
    await this.ensureFileExists(date);
    await this.vault.write(this.getDayFilePath(date), content);
  }
}

/** Adapter that wraps Obsidian's real Vault API. Used in main.ts. */
export function createObsidianVaultAdapter(app: any): VaultLike {
  return {
    async exists(path: string) {
      return await app.vault.adapter.exists(path);
    },
    async read(path: string) {
      return await app.vault.adapter.read(path);
    },
    async write(path: string, content: string) {
      await app.vault.adapter.write(path, content);
    },
    async createFolder(path: string) {
      try {
        await app.vault.createFolder(path);
      } catch {
        /* folder exists — fine */
      }
    },
  };
}
