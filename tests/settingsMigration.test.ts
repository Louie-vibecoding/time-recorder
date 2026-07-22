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

  it("已配置 flashNotePath → 原样保留、recovered=false", () => {
    const input = {
      version: 1,
      recordsFolder: "我的/记录",
      templatePath: "我的/模板.md",
      flashNotePath: "收集箱/闪记.md",
      categories: [{ id: "study", name: "学习", emoji: "📚", aliases: [] }],
    };
    const { settings, recovered } = migrateSettings(input);
    expect(recovered).toBe(false);
    expect(settings.flashNotePath).toBe("收集箱/闪记.md");
  });

  it("旧版 data.json 缺 flashNotePath / 类型错 → 回填空串（= 未配置）、recovered=false", () => {
    const base = {
      version: 1,
      categories: [{ id: "study", name: "学习", emoji: "📚", aliases: [] }],
    };
    const missing = migrateSettings(base);
    expect(missing.recovered).toBe(false);
    expect(missing.settings.flashNotePath).toBe("");

    const wrongType = migrateSettings({ ...base, flashNotePath: 42 });
    expect(wrongType.recovered).toBe(false);
    expect(wrongType.settings.flashNotePath).toBe("");
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

  describe("language 字段（1.0.5 新增）", () => {
    const base = {
      version: 1,
      recordsFolder: "我的/记录",
      templatePath: "我的/模板.md",
      categories: [{ id: "study", name: "学习", emoji: "📚", aliases: [] }],
    };

    it("1.0.4 及之前的 data.json（缺 language）→ 回填 auto、recovered=false", () => {
      const { settings, recovered } = migrateSettings(base);
      expect(recovered).toBe(false);
      expect(settings.language).toBe("auto");
    });

    it("合法值（auto/zh/en/ja/ko）原样保留", () => {
      for (const lang of ["auto", "zh", "en", "ja", "ko"] as const) {
        const { settings, recovered } = migrateSettings({ ...base, language: lang });
        expect(recovered).toBe(false);
        expect(settings.language).toBe(lang);
      }
    });

    it("非法值（未知语言/数字/对象）→ 静默回退 auto、绝不置 recovered（纯偏好字段坏了不吓用户）", () => {
      for (const bad of ["fr", "zh-TW", 42, {}, null, true]) {
        const { settings, recovered } = migrateSettings({ ...base, language: bad });
        expect(recovered, JSON.stringify(bad)).toBe(false);
        expect(settings.language, JSON.stringify(bad)).toBe("auto");
      }
    });

    it("1.0.4 真实 data.json 升级快照：除新增 language:auto 外逐字段一致", () => {
      const v104 = {
        version: 1,
        recordsFolder: "反省日志/时间记录",
        templatePath: "反省日志/时间记录/timer template.md",
        flashNotePath: "收集箱.md",
        categories: [
          { id: "sleep", name: "睡觉觉", emoji: "😴", aliases: ["睡觉", "午睡"] },
          { id: "study", name: "学习", emoji: "📚", aliases: ["阅读"] },
        ],
      };
      const { settings, recovered } = migrateSettings(v104);
      expect(recovered).toBe(false);
      expect(settings).toEqual({ ...v104, language: "auto" });
    });
  });
});
