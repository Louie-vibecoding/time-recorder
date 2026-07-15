import { describe, it, expect } from "vitest";
import { resolveLang, format, STRINGS } from "../src/i18n";
import {
  summarizeDay,
  formatSummaryAsMarkdown,
  MarkdownStrings,
} from "../src/summarize";
import { validateSegmentTimes, SegmentTimeMessages } from "../src/segmentEdit";
import { validateCategoryName, CategoryNameMessages } from "../src/settingsValidation";
import { relativeDayLabel, RelDayLabels } from "../src/date";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORIES_EN,
  defaultCategoriesFor,
  defaultCategoriesForRestore,
  defaultSettingsFor,
} from "../src/settings";

describe("resolveLang", () => {
  it("中文 locale（含繁体/大小写混写）→ zh", () => {
    expect(resolveLang("zh")).toBe("zh");
    expect(resolveLang("zh-TW")).toBe("zh");
    expect(resolveLang("ZH-cn")).toBe("zh");
  });

  it("其它 locale / 空值 → en", () => {
    expect(resolveLang("en")).toBe("en");
    expect(resolveLang("ja")).toBe("en");
    expect(resolveLang("")).toBe("en");
    expect(resolveLang(null)).toBe("en");
    expect(resolveLang(undefined)).toBe("en");
  });
});

describe("format", () => {
  it("替换多个占位符", () => {
    expect(format("{a} + {b} = {a}{b}", { a: "1", b: "2" })).toBe("1 + 2 = 12");
  });

  it("未提供的占位符原样保留", () => {
    expect(format("hi {name}", {})).toBe("hi {name}");
  });
});

describe("STRINGS 字典", () => {
  it("zh / en 键位完全一致（防止漏翻）", () => {
    expect(Object.keys(STRINGS.zh).sort()).toEqual(Object.keys(STRINGS.en).sort());
  });

  it("所有值非空", () => {
    for (const lang of ["zh", "en"] as const) {
      for (const [k, v] of Object.entries(STRINGS[lang])) {
        expect(v.length, `${lang}.${k}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("formatSummaryAsMarkdown 文案注入", () => {
  const day = { date: "2026-7-15", filePath: "x.md", segments: [] };
  const summary = summarizeDay(day, [], "12:00");

  it("默认仍是中文（老行为不变）", () => {
    const md = formatSummaryAsMarkdown(day, summary, []);
    expect(md).toContain("## 时间总结（2026-7-15）");
    expect(md).toContain("⚪ 未记录");
    expect(md).toContain("**合计**");
  });

  it("传英文文案 → 英文输出", () => {
    const en: MarkdownStrings = {
      headingTpl: "## Time summary ({title})",
      tableHeader: "| # | Category | Duration | Share | Activities |",
      unrecordedLabel: "⚪ Unrecorded",
      totalLabel: "Total",
    };
    const md = formatSummaryAsMarkdown(day, summary, [], en);
    expect(md).toContain("## Time summary (2026-7-15)");
    expect(md).toContain("| # | Category | Duration | Share | Activities |");
    expect(md).toContain("⚪ Unrecorded");
    expect(md).toContain("**Total**");
  });
});

describe("validateSegmentTimes 文案注入", () => {
  const msgs: SegmentTimeMessages = {
    startInvalid: "SI",
    endInvalid: "EI",
    endNotAfterStart: "ENAS",
  };

  it("默认中文不变", () => {
    expect(validateSegmentTimes("bad", "").error).toBe("开始时间无效");
  });

  it("注入文案生效", () => {
    expect(validateSegmentTimes("bad", "", msgs).error).toBe("SI");
    expect(validateSegmentTimes("10:00", "xx", msgs).error).toBe("EI");
    expect(validateSegmentTimes("10:00", "09:00", msgs).error).toBe("ENAS");
  });
});

describe("validateCategoryName 文案注入", () => {
  const msgs: CategoryNameMessages = { empty: "E", duplicate: "D" };
  const cats = [{ id: "a", name: "学习", emoji: "📚", aliases: [] }];

  it("默认中文不变", () => {
    expect(validateCategoryName("", cats, -1)).toBe("分类名不能为空");
  });

  it("注入文案生效", () => {
    expect(validateCategoryName("", cats, -1, msgs)).toBe("E");
    expect(validateCategoryName("学习", cats, -1, msgs)).toBe("D");
  });
});

describe("relativeDayLabel 文案注入", () => {
  const en: RelDayLabels = { today: "Today", yesterday: "Yesterday", tomorrow: "Tomorrow" };

  it("默认中文不变", () => {
    expect(relativeDayLabel("2026-7-15", "2026-7-15")).toBe("今天");
  });

  it("注入英文标签生效", () => {
    expect(relativeDayLabel("2026-7-15", "2026-7-15", en)).toBe("Today");
    expect(relativeDayLabel("2026-7-14", "2026-7-15", en)).toBe("Yesterday");
    expect(relativeDayLabel("2026-7-16", "2026-7-15", en)).toBe("Tomorrow");
    expect(relativeDayLabel("2026-7-1", "2026-7-15", en)).toBe("");
  });
});

describe("英文默认分类与设置", () => {
  it("en 分类 id 与 zh 一一对应（顺序一致，颜色/归类稳定）", () => {
    expect(DEFAULT_CATEGORIES_EN.map((c) => c.id)).toEqual(
      DEFAULT_CATEGORIES.map((c) => c.id),
    );
  });

  it("defaultCategoriesFor 返回深拷贝，改结果不污染常量", () => {
    const cats = defaultCategoriesFor("en");
    cats[0].aliases.push("polluted");
    cats[0].name = "polluted";
    expect(DEFAULT_CATEGORIES_EN[0].aliases).not.toContain("polluted");
    expect(DEFAULT_CATEGORIES_EN[0].name).not.toBe("polluted");
  });

  it("defaultSettingsFor 按语言给默认路径；文件名格式不在其中（数据层统一）", () => {
    expect(defaultSettingsFor("zh").recordsFolder).toBe("反省日志/时间记录");
    expect(defaultSettingsFor("en").recordsFolder).toBe("Time Records");
    expect(defaultSettingsFor("en").categories[0].name).toBe("Sleep");
    expect(defaultSettingsFor("zh").categories[0].name).toBe("睡眠");
  });
});

describe("defaultCategoriesForRestore 跨语言关键词桥接", () => {
  it("en 恢复分类的关键词并入中文名+中文关键词（历史记录不掉 Other）", () => {
    const meals = defaultCategoriesForRestore("en").find((c) => c.id === "meal")!;
    expect(meals.name).toBe("Meals");
    expect(meals.aliases).toContain("饮食");
    expect(meals.aliases).toContain("吃饭");
    expect(meals.aliases).toContain("breakfast"); // 自身关键词保留
  });

  it("zh 恢复分类的关键词并入英文名+英文关键词（反向同理）", () => {
    const sleep = defaultCategoriesForRestore("zh").find((c) => c.id === "sleep")!;
    expect(sleep.name).toBe("睡眠");
    expect(sleep.aliases).toContain("Sleep");
    expect(sleep.aliases).toContain("nap");
    expect(sleep.aliases).toContain("睡觉");
  });

  it("忽略大小写去重，不产生重复关键词", () => {
    for (const c of defaultCategoriesForRestore("en")) {
      const lower = c.aliases.map((a) => a.trim().toLowerCase());
      expect(new Set(lower).size).toBe(lower.length);
    }
  });

  it("不带桥接的 defaultCategoriesFor 保持干净（全新安装不受影响）", () => {
    const meals = defaultCategoriesFor("en").find((c) => c.id === "meal")!;
    expect(meals.aliases).not.toContain("饮食");
  });
});
