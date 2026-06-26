import { describe, it, expect } from "vitest";
import { migrateSettings, CURRENT_SETTINGS_VERSION } from "../src/settingsMigration";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "../src/settings";

describe("migrateSettings", () => {
  it("首次安装（null/undefined）→ 默认设置、不算回退", () => {
    for (const input of [null, undefined]) {
      const { settings, recovered } = migrateSettings(input);
      expect(recovered).toBe(false);
      expect(settings.version).toBe(CURRENT_SETTINGS_VERSION);
      expect(settings.recordsFolder).toBe(DEFAULT_SETTINGS.recordsFolder);
      expect(settings.categories).toHaveLength(DEFAULT_CATEGORIES.length);
    }
  });

  it("顶层是数组 → 默认设置、recovered=true", () => {
    const { settings, recovered } = migrateSettings([1, 2, 3]);
    expect(recovered).toBe(true);
    expect(settings.categories).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it("顶层是字符串/数字 → 默认设置、recovered=true", () => {
    expect(migrateSettings("oops").recovered).toBe(true);
    expect(migrateSettings(42).recovered).toBe(true);
    expect(migrateSettings("oops").settings.categories).toHaveLength(
      DEFAULT_CATEGORIES.length,
    );
  });

  it("正常完整 v1 → 原样保留、recovered=false", () => {
    const input = {
      version: 1,
      recordsFolder: "我的/记录",
      templatePath: "我的/模板.md",
      categories: [{ id: "study", name: "学习", emoji: "📚", aliases: ["阅读"] }],
    };
    const { settings, recovered } = migrateSettings(input);
    expect(recovered).toBe(false);
    expect(settings.recordsFolder).toBe("我的/记录");
    expect(settings.templatePath).toBe("我的/模板.md");
    expect(settings.categories).toEqual([
      { id: "study", name: "学习", emoji: "📚", aliases: ["阅读"] },
    ]);
  });

  it("缺 templatePath → 回填默认、recovered=false", () => {
    const input = {
      version: 1,
      recordsFolder: "我的/记录",
      categories: [{ id: "study", name: "学习", emoji: "📚", aliases: [] }],
    };
    const { settings, recovered } = migrateSettings(input);
    expect(recovered).toBe(false);
    expect(settings.templatePath).toBe(DEFAULT_SETTINGS.templatePath);
  });

  it("categories 缺失 → 默认分类、recovered=true", () => {
    const { settings, recovered } = migrateSettings({ version: 1, recordsFolder: "x" });
    expect(recovered).toBe(true);
    expect(settings.categories).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it("categories 非数组 → 默认分类、recovered=true", () => {
    const { settings, recovered } = migrateSettings({ categories: "nope" });
    expect(recovered).toBe(true);
    expect(settings.categories).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it("分类条目缺 aliases → 回填 []、recovered=false", () => {
    const input = { categories: [{ id: "study", name: "学习", emoji: "📚" }] };
    const { settings, recovered } = migrateSettings(input);
    expect(recovered).toBe(false);
    expect(settings.categories[0].aliases).toEqual([]);
  });

  it("分类条目缺必需字段 → 丢弃该条、其余保留、recovered=false", () => {
    const input = {
      categories: [
        { id: "study", name: "学习", emoji: "📚", aliases: [] },
        { id: "", name: "坏", emoji: "x", aliases: [] },
        { name: "无id", emoji: "y", aliases: [] },
      ],
    };
    const { settings, recovered } = migrateSettings(input);
    expect(recovered).toBe(false);
    expect(settings.categories).toHaveLength(1);
    expect(settings.categories[0].id).toBe("study");
  });

  it("所有条目都无效 → 默认分类、recovered=true", () => {
    const input = { categories: [{ id: "", name: "", emoji: "" }, "garbage"] };
    const { settings, recovered } = migrateSettings(input);
    expect(recovered).toBe(true);
    expect(settings.categories).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it("version 比当前新 → 尽力合并使用、recovered=false", () => {
    const input = {
      version: CURRENT_SETTINGS_VERSION + 5,
      recordsFolder: "未来/记录",
      templatePath: "未来/模板.md",
      categories: [{ id: "study", name: "学习", emoji: "📚", aliases: ["阅读"] }],
    };
    const { settings, recovered } = migrateSettings(input);
    expect(recovered).toBe(false);
    expect(settings.recordsFolder).toBe("未来/记录");
    expect(settings.categories[0].id).toBe("study");
  });

  it("任意输入 → 输出 version 都戳成当前版本", () => {
    expect(migrateSettings(null).settings.version).toBe(CURRENT_SETTINGS_VERSION);
    expect(migrateSettings({ version: 99 }).settings.version).toBe(CURRENT_SETTINGS_VERSION);
    expect(migrateSettings([]).settings.version).toBe(CURRENT_SETTINGS_VERSION);
  });

  it("不与默认对象共享引用（深拷贝，改返回值不污染 DEFAULT_CATEGORIES）", () => {
    const { settings } = migrateSettings(null);
    settings.categories[0].aliases.push("污染");
    expect(DEFAULT_CATEGORIES[0].aliases).not.toContain("污染");
  });
});
