import { Category, LanguageSetting, TimeRecorderSettings } from "./types";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "./settings";

/** 当前设置 schema 版本（单一真相 = DEFAULT_SETTINGS.version）。 */
export const CURRENT_SETTINGS_VERSION = DEFAULT_SETTINGS.version;

export interface MigrationOutcome {
  /** 迁移/校验后可安全使用的设置。 */
  settings: TimeRecorderSettings;
  /** true = 数据不可信、已整体回退默认 → 调用方应备份原文件并提示用户。 */
  recovered: boolean;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 深拷贝出厂默认，避免与 DEFAULT_* 共享引用。 */
function cloneDefaults(): TimeRecorderSettings {
  return {
    version: CURRENT_SETTINGS_VERSION,
    language: DEFAULT_SETTINGS.language,
    recordsFolder: DEFAULT_SETTINGS.recordsFolder,
    templatePath: DEFAULT_SETTINGS.templatePath,
    flashNotePath: DEFAULT_SETTINGS.flashNotePath,
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, aliases: [...c.aliases] })),
  };
}

/**
 * 语言偏好抢救：缺失（1.0.4 及之前的 data.json）或任何非法值一律回退 "auto"，
 * 且不置 recovered —— 一个纯偏好字段坏了不值得吓用户「设置损坏」并备份文件。
 */
function normalizeLanguage(raw: unknown): LanguageSetting {
  return raw === "auto" || raw === "zh" || raw === "en" || raw === "ja" || raw === "ko"
    ? raw
    : "auto";
}

/** 抢救单个分类条目；缺必需字段返回 null（= 丢弃）。 */
function normalizeCategory(raw: unknown): Category | null {
  if (!isPlainObject(raw)) return null;
  const { id, name, emoji, aliases } = raw;
  if (typeof id !== "string" || id.trim() === "") return null;
  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof emoji !== "string" || emoji === "") return null;
  const safeAliases = Array.isArray(aliases)
    ? aliases.filter((a): a is string => typeof a === "string")
    : [];
  return { id, name, emoji, aliases: safeAliases };
}

/**
 * 把磁盘读到的任意值迁移/校验成可用设置。纯函数、无副作用。
 */
export function migrateSettings(loaded: unknown): MigrationOutcome {
  // 1. 首次安装：还没有 data.json。不是损坏，不打扰。
  if (loaded === null || loaded === undefined) {
    return { settings: cloneDefaults(), recovered: false };
  }
  // 2. 顶层不是对象（数组/字符串/数字）→ 损坏，回退默认。
  if (!isPlainObject(loaded)) {
    return { settings: cloneDefaults(), recovered: true };
  }

  const defaults = cloneDefaults();
  let recovered = false;

  const recordsFolder =
    typeof loaded.recordsFolder === "string" && loaded.recordsFolder.trim() !== ""
      ? loaded.recordsFolder
      : defaults.recordsFolder;

  const templatePath =
    typeof loaded.templatePath === "string" && loaded.templatePath.trim() !== ""
      ? loaded.templatePath
      : defaults.templatePath;

  // 闪记目标：空串是合法值（= 未配置），只挡类型错误，不回填非空默认。
  const flashNotePath =
    typeof loaded.flashNotePath === "string" ? loaded.flashNotePath : defaults.flashNotePath;

  let categories: Category[];
  if (!Array.isArray(loaded.categories)) {
    categories = defaults.categories;
    recovered = true;
  } else {
    const salvaged = loaded.categories
      .map(normalizeCategory)
      .filter((c): c is Category => c !== null);
    if (salvaged.length === 0) {
      categories = defaults.categories;
      recovered = true;
    } else {
      categories = salvaged;
    }
  }

  return {
    settings: {
      version: CURRENT_SETTINGS_VERSION,
      language: normalizeLanguage(loaded.language),
      recordsFolder,
      templatePath,
      flashNotePath,
      categories,
    },
    recovered,
  };
}
