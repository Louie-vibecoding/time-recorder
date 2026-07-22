import { describe, it, expect, afterEach } from "vitest";
import {
  resolveLang,
  format,
  STRINGS,
  LANG_NAMES,
  getLang,
  setLangOverride,
  __resetLangCache,
} from "../src/i18n";
import {
  summarizeDay,
  formatSummaryAsMarkdown,
  MarkdownStrings,
} from "../src/summarize";
import { validateSegmentTimes, SegmentTimeMessages } from "../src/segmentEdit";
import { validateCategoryName, CategoryNameMessages } from "../src/settingsValidation";
import { relativeDayLabel, RelDayLabels } from "../src/date";
import {
  ALL_LANGS,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORIES_EN,
  DEFAULT_CATEGORIES_JA,
  DEFAULT_CATEGORIES_KO,
  defaultCategoriesFor,
  defaultCategoriesForRestore,
  defaultSettingsFor,
  legacyRestoreCategories,
  pristineDefaultLang,
} from "../src/settings";
import { inferCategoryId } from "../src/categoryInfer";

describe("resolveLang", () => {
  it("中文 locale（含繁体/大小写混写）→ zh", () => {
    expect(resolveLang("zh")).toBe("zh");
    expect(resolveLang("zh-TW")).toBe("zh");
    expect(resolveLang("ZH-cn")).toBe("zh");
  });

  it("日语 / 韩语 locale → ja / ko", () => {
    expect(resolveLang("ja")).toBe("ja");
    expect(resolveLang("ja-JP")).toBe("ja");
    expect(resolveLang("ko")).toBe("ko");
    expect(resolveLang("KO-kr")).toBe("ko");
  });

  it("其它 locale / 空值 → en", () => {
    expect(resolveLang("en")).toBe("en");
    expect(resolveLang("fr")).toBe("en");
    expect(resolveLang("")).toBe("en");
    expect(resolveLang(null)).toBe("en");
    expect(resolveLang(undefined)).toBe("en");
  });
});

describe("setLangOverride / getLang", () => {
  afterEach(() => __resetLangCache());

  it("override 优先于自动检测", () => {
    setLangOverride("ja");
    expect(getLang()).toBe("ja");
    setLangOverride("ko");
    expect(getLang()).toBe("ko");
  });

  it("override 置 null → 回到自动检测（node 环境无 localStorage → en）", () => {
    setLangOverride("zh");
    expect(getLang()).toBe("zh");
    setLangOverride(null);
    expect(getLang()).toBe("en");
  });

  it("__resetLangCache 同时清除 override", () => {
    setLangOverride("ja");
    __resetLangCache();
    expect(getLang()).toBe("en");
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
  it("四语言键位完全一致（防止漏翻）", () => {
    const zhKeys = Object.keys(STRINGS.zh).sort();
    for (const lang of ALL_LANGS) {
      expect(Object.keys(STRINGS[lang]).sort(), lang).toEqual(zhKeys);
    }
  });

  it("所有值非空", () => {
    for (const lang of ALL_LANGS) {
      for (const [k, v] of Object.entries(STRINGS[lang])) {
        expect(v.length, `${lang}.${k}`).toBeGreaterThan(0);
      }
    }
  });

  it("占位符 {xxx} 在各语言间一一对应（防止翻译弄丢变量）", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(STRINGS.zh) as (keyof typeof STRINGS.zh)[]) {
      const expected = placeholders(STRINGS.zh[key]);
      for (const lang of ALL_LANGS) {
        expect(placeholders(STRINGS[lang][key]), `${lang}.${key}`).toEqual(expected);
      }
    }
  });

  it("LANG_NAMES 覆盖全部语言且用母语自称", () => {
    expect(Object.keys(LANG_NAMES).sort()).toEqual([...ALL_LANGS].sort());
    expect(LANG_NAMES.zh).toBe("简体中文");
    expect(LANG_NAMES.ja).toBe("日本語");
    expect(LANG_NAMES.ko).toBe("한국어");
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

describe("多语言默认分类与设置", () => {
  it("en/ja/ko 分类 id 与 zh 一一对应（顺序一致，颜色/归类稳定）", () => {
    const zhIds = DEFAULT_CATEGORIES.map((c) => c.id);
    expect(DEFAULT_CATEGORIES_EN.map((c) => c.id)).toEqual(zhIds);
    expect(DEFAULT_CATEGORIES_JA.map((c) => c.id)).toEqual(zhIds);
    expect(DEFAULT_CATEGORIES_KO.map((c) => c.id)).toEqual(zhIds);
  });

  it("ja/ko 分类名已本地化（非中文占位、非英文照搬）", () => {
    for (const [i, zhCat] of DEFAULT_CATEGORIES.entries()) {
      expect(DEFAULT_CATEGORIES_JA[i].name, `ja[${zhCat.id}]`).not.toBe(
        DEFAULT_CATEGORIES_EN[i].name,
      );
      expect(DEFAULT_CATEGORIES_KO[i].name, `ko[${zhCat.id}]`).not.toBe(zhCat.name);
      expect(DEFAULT_CATEGORIES_KO[i].name, `ko[${zhCat.id}]`).not.toBe(
        DEFAULT_CATEGORIES_EN[i].name,
      );
    }
  });

  it("ja/ko 全新安装默认路径沿用英文（文件名格式本就统一，不放大路径矩阵）", () => {
    for (const lang of ["ja", "ko"] as const) {
      expect(defaultSettingsFor(lang).recordsFolder).toBe("Time Records");
      expect(defaultSettingsFor(lang).templatePath).toBe("Time Records/timer template.md");
      expect(defaultSettingsFor(lang).language).toBe("auto");
    }
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

describe("defaultCategoriesForRestore 跨语言关键词桥接（四语言互桥）", () => {
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

  it("每个语言的恢复集都并入其余三语言的分类名（4×4 归类矩阵）", () => {
    for (const target of ALL_LANGS) {
      const restored = defaultCategoriesForRestore(target);
      for (const source of ALL_LANGS) {
        if (source === target) continue;
        for (const srcCat of defaultCategoriesFor(source)) {
          const cat = restored.find((c) => c.id === srcCat.id)!;
          const pool = [cat.name, ...cat.aliases].map((a) => a.trim().toLowerCase());
          expect(pool, `${target} 恢复集应含 ${source}.${srcCat.id} 的名称`).toContain(
            srcCat.name.trim().toLowerCase(),
          );
        }
      }
    }
  });

  it("忽略大小写去重，不产生重复关键词（全部语言）", () => {
    for (const lang of ALL_LANGS) {
      for (const c of defaultCategoriesForRestore(lang)) {
        const lower = c.aliases.map((a) => a.trim().toLowerCase());
        expect(new Set(lower).size, `${lang}.${c.id}`).toBe(lower.length);
      }
    }
  });

  it("不带桥接的 defaultCategoriesFor 保持干净（全新安装不受影响）", () => {
    const meals = defaultCategoriesFor("en").find((c) => c.id === "meal")!;
    expect(meals.aliases).not.toContain("饮食");
  });

  it("桥接不携带高频拉丁子串别名（回归锁定：ja 的 LINE 曾把 online/deadline 吸进社交）", () => {
    for (const lang of ALL_LANGS) {
      for (const c of defaultCategoriesForRestore(lang)) {
        const lower = c.aliases.map((a) => a.toLowerCase());
        expect(lower, `${lang}.${c.id}`).not.toContain("line");
      }
    }
    // 行为级：切语言后的英文活动名仍按语义归类，不被前排分类的子串截胡
    const restored = defaultCategoriesForRestore("en");
    expect(inferCategoryId("online meeting", restored)).toBe("work");
    expect(inferCategoryId("deadline crunch overtime", restored)).toBe("work");
    expect(inferCategoryId("online gaming", restored)).toBe("fun");
  });
});

describe("pristineDefaultLang 纯净判定", () => {
  it("出厂默认集 / 恢复集都命中对应语言", () => {
    for (const lang of ALL_LANGS) {
      expect(pristineDefaultLang(defaultCategoriesFor(lang)), `for(${lang})`).toBe(lang);
      expect(
        pristineDefaultLang(defaultCategoriesForRestore(lang)),
        `restore(${lang})`,
      ).toBe(lang);
    }
  });

  it("aliases 顺序打乱 / 大小写变化仍命中（与桥接去重规则一致）", () => {
    const cats = defaultCategoriesFor("en");
    cats[0].aliases.reverse();
    cats[1].aliases = cats[1].aliases.map((a) => a.toUpperCase());
    expect(pristineDefaultLang(cats)).toBe("en");
  });

  it("任何一处自定义（改名/换 emoji/增删关键词/删分类）→ null，绝不误伤用户数据", () => {
    const renamed = defaultCategoriesFor("zh");
    renamed[2].name = "干饭";
    expect(pristineDefaultLang(renamed)).toBeNull();

    const emojiChanged = defaultCategoriesFor("zh");
    emojiChanged[0].emoji = "🌙";
    expect(pristineDefaultLang(emojiChanged)).toBeNull();

    const aliasAdded = defaultCategoriesFor("en");
    aliasAdded[3].aliases.push("skincare");
    expect(pristineDefaultLang(aliasAdded)).toBeNull();

    const removed = defaultCategoriesFor("en").slice(1);
    expect(pristineDefaultLang(removed)).toBeNull();
  });

  it("来回切换幂等：恢复集在目标语言下仍判定为纯净（切回即可再次自动跟随）", () => {
    const afterSwitch = defaultCategoriesForRestore("ja");
    expect(pristineDefaultLang(afterSwitch)).toBe("ja");
    const backAgain = defaultCategoriesForRestore("zh");
    expect(pristineDefaultLang(backAgain)).toBe("zh");
  });

  it("识别 1.0.3/1.0.4 的双语恢复集（升级前点过恢复的老用户不被误判为自定义）", () => {
    // 测试内独立复刻 1.0.4 旧算法（仅 zh↔en 互桥），防止实现与测试同源出错
    const build104Restore = (lang: "zh" | "en") => {
      const base = defaultCategoriesFor(lang);
      const twin = lang === "zh" ? DEFAULT_CATEGORIES_EN : DEFAULT_CATEGORIES;
      for (const c of base) {
        const tw = twin.find((o) => o.id === c.id)!;
        for (const cand of [tw.name, ...tw.aliases]) {
          if (!c.aliases.some((a) => a.trim().toLowerCase() === cand.trim().toLowerCase())) {
            c.aliases.push(cand);
          }
        }
      }
      return base;
    };
    expect(pristineDefaultLang(build104Restore("zh"))).toBe("zh");
    expect(pristineDefaultLang(build104Restore("en"))).toBe("en");
    expect(pristineDefaultLang(legacyRestoreCategories("zh"))).toBe("zh");
    expect(pristineDefaultLang(legacyRestoreCategories("en"))).toBe("en");
  });
});
