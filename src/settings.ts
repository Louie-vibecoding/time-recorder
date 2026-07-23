import { Category, Lang, TimeRecorderSettings } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "sleep",   name: "睡眠",     emoji: "😴", aliases: ["睡觉", "午睡"] },
  { id: "study",   name: "学习",     emoji: "📚", aliases: ["阅读", "听课", "复习"] },
  { id: "meal",    name: "饮食",     emoji: "🍱", aliases: ["吃饭", "早饭", "午饭", "晚饭", "吃早", "吃午", "吃晚", "外卖"] },
  { id: "hygiene", name: "个人卫生", emoji: "🚿", aliases: ["洗漱", "上厕所", "洗澡", "刷牙"] },
  { id: "commute", name: "通勤",     emoji: "🚗", aliases: ["地铁", "公交", "打车"] },
  { id: "social",  name: "社交",     emoji: "💬", aliases: ["微信", "聊天", "电话", "朋友"] },
  { id: "chores",  name: "家务",     emoji: "🧹", aliases: ["整理", "打扫", "洗衣"] },
  { id: "work",    name: "工作",     emoji: "💼", aliases: ["上班", "开会", "加班"] },
  { id: "sport",   name: "运动",     emoji: "🏃", aliases: ["跑步", "健身", "锻炼"] },
  { id: "fun",     name: "娱乐",     emoji: "🎮", aliases: ["游戏", "刷手机", "看剧", "视频"] },
];

export const OTHER_CATEGORY: Category = {
  id: "other",
  name: "其他",
  emoji: "❓",
  aliases: [],
};

export const DEFAULT_SETTINGS: TimeRecorderSettings = {
  version: 1,
  language: "auto",
  recordsFolder: "反省日志/时间记录",
  templatePath: "反省日志/时间记录/timer template.md",
  flashNotePath: "",
  categories: DEFAULT_CATEGORIES,
};

/**
 * 英文默认分类：id 与中文默认一一对应（颜色映射 / 已有记录的归类保持稳定），
 * 仅名称与关键词本地化。只影响「全新安装且界面为英文」的首次初始化。
 */
export const DEFAULT_CATEGORIES_EN: Category[] = [
  { id: "sleep",   name: "Sleep",    emoji: "😴", aliases: ["nap"] },
  { id: "study",   name: "Study",    emoji: "📚", aliases: ["reading", "class", "review"] },
  { id: "meal",    name: "Meals",    emoji: "🍱", aliases: ["breakfast", "lunch", "dinner", "eat", "food", "takeout"] },
  { id: "hygiene", name: "Hygiene",  emoji: "🚿", aliases: ["shower", "wash", "toilet", "teeth"] },
  { id: "commute", name: "Commute",  emoji: "🚗", aliases: ["subway", "bus", "taxi", "drive"] },
  { id: "social",  name: "Social",   emoji: "💬", aliases: ["chat", "call", "phone", "friends"] },
  { id: "chores",  name: "Chores",   emoji: "🧹", aliases: ["cleaning", "laundry", "tidy"] },
  { id: "work",    name: "Work",     emoji: "💼", aliases: ["meeting", "overtime", "office"] },
  { id: "sport",   name: "Exercise", emoji: "🏃", aliases: ["run", "gym", "workout"] },
  { id: "fun",     name: "Fun",      emoji: "🎮", aliases: ["game", "gaming", "video", "tv"] },
];

/** 日语默认分类：id/emoji/顺序与中文默认一一对应，仅名称与关键词本地化。 */
export const DEFAULT_CATEGORIES_JA: Category[] = [
  { id: "sleep",   name: "睡眠",       emoji: "😴", aliases: ["寝る", "昼寝", "仮眠", "就寝"] },
  { id: "study",   name: "勉強",       emoji: "📚", aliases: ["学習", "読書", "授業", "講義", "復習", "予習"] },
  { id: "meal",    name: "食事",       emoji: "🍱", aliases: ["朝食", "昼食", "夕食", "ご飯", "ランチ", "外食"] },
  { id: "hygiene", name: "洗面・入浴", emoji: "🚿", aliases: ["洗面", "歯磨き", "入浴", "シャワー", "お風呂", "トイレ"] },
  { id: "commute", name: "通勤",       emoji: "🚗", aliases: ["電車", "バス", "移動", "運転", "通学", "タクシー"] },
  // 注意：不能用拉丁字母 "LINE" 作别名——它会经四语桥接进入所有语言的恢复集，
  // 而归类是小写子串匹配，"line" 会吞掉 online/deadline 等英文活动（social 排位在 work/sport/fun 之前）。
  { id: "social",  name: "交流",       emoji: "💬", aliases: ["ライン", "チャット", "電話", "友達", "飲み会", "連絡"] },
  { id: "chores",  name: "家事",       emoji: "🧹", aliases: ["掃除", "洗濯", "片付け", "料理", "買い物"] },
  { id: "work",    name: "仕事",       emoji: "💼", aliases: ["会議", "打ち合わせ", "残業", "出勤", "業務", "ミーティング"] },
  { id: "sport",   name: "運動",       emoji: "🏃", aliases: ["ランニング", "ジム", "筋トレ", "散歩", "ヨガ", "ストレッチ"] },
  { id: "fun",     name: "娯楽",       emoji: "🎮", aliases: ["ゲーム", "動画", "スマホ", "アニメ", "YouTube", "テレビ"] },
];

/** 韩语默认分类：id/emoji/顺序与中文默认一一对应，仅名称与关键词本地化。 */
export const DEFAULT_CATEGORIES_KO: Category[] = [
  { id: "sleep",   name: "수면",     emoji: "😴", aliases: ["잠자기", "낮잠", "취침", "쪽잠"] },
  { id: "study",   name: "공부",     emoji: "📚", aliases: ["독서", "수업", "복습", "강의", "학습"] },
  { id: "meal",    name: "식사",     emoji: "🍱", aliases: ["아침밥", "점심", "저녁밥", "밥", "먹기", "간식"] },
  { id: "hygiene", name: "위생",     emoji: "🚿", aliases: ["샤워", "세수", "양치", "화장실", "목욕"] },
  { id: "commute", name: "이동",     emoji: "🚗", aliases: ["출근", "퇴근", "지하철", "버스", "택시", "운전"] },
  { id: "social",  name: "인간관계", emoji: "💬", aliases: ["카톡", "채팅", "전화", "통화", "친구", "모임"] },
  { id: "chores",  name: "집안일",   emoji: "🧹", aliases: ["청소", "빨래", "정리", "설거지"] },
  { id: "work",    name: "업무",     emoji: "💼", aliases: ["회사", "회의", "야근", "미팅"] },
  { id: "sport",   name: "운동",     emoji: "🏃", aliases: ["달리기", "헬스", "조깅", "산책", "요가"] },
  { id: "fun",     name: "여가",     emoji: "🎮", aliases: ["게임", "유튜브", "넷플릭스", "드라마", "웹툰", "SNS"] },
];

/** 全部语言（固定顺序：桥接合并与纯净判定的确定性来源）。 */
export const ALL_LANGS: Lang[] = ["zh", "en", "ja", "ko"];

const ALL_DEFAULT_CATEGORIES: Record<Lang, Category[]> = {
  zh: DEFAULT_CATEGORIES,
  en: DEFAULT_CATEGORIES_EN,
  ja: DEFAULT_CATEGORIES_JA,
  ko: DEFAULT_CATEGORIES_KO,
};

/** 按语言取默认分类（深拷贝，调用方可安全修改）。 */
export function defaultCategoriesFor(lang: Lang): Category[] {
  return ALL_DEFAULT_CATEGORIES[lang].map((c) => ({ ...c, aliases: [...c.aliases] }));
}

/**
 * 「恢复默认分类」专用：目标语言默认之上，把其余所有语言的名称+关键词并入
 * aliases（忽略大小写去重）。这样切换界面语言后恢复，历史记录里旧语言写下的
 * 活动名（如「睡眠」「吃饭」「昼寝」）仍能正确归类，不会掉进 Other。
 * 全新安装（defaultSettingsFor）不带桥接，保持关键词列表干净。
 */
export function defaultCategoriesForRestore(lang: Lang): Category[] {
  const base = defaultCategoriesFor(lang);
  for (const other of ALL_LANGS) {
    if (other === lang) continue;
    const twin = ALL_DEFAULT_CATEGORIES[other];
    for (const c of base) {
      const tw = twin.find((o) => o.id === c.id);
      if (!tw) continue;
      for (const cand of [tw.name, ...tw.aliases]) {
        if (!c.aliases.some((a) => a.trim().toLowerCase() === cand.trim().toLowerCase())) {
          c.aliases.push(cand);
        }
      }
    }
  }
  return base;
}

/** 两个分类条目等价：id/name/emoji 严格（trim），aliases 忽略顺序与大小写。 */
function sameCategory(a: Category, b: Category): boolean {
  if (a.id !== b.id || a.name.trim() !== b.name.trim() || a.emoji !== b.emoji) {
    return false;
  }
  const norm = (xs: string[]) => new Set(xs.map((x) => x.trim().toLowerCase()));
  const sa = norm(a.aliases);
  const sb = norm(b.aliases);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
}

function sameCategorySet(a: Category[], b: Category[]): boolean {
  return a.length === b.length && a.every((ca, i) => sameCategory(ca, b[i]));
}

/**
 * 1.0.3–1.0.4 的「恢复默认分类」只做 zh↔en 双语桥接（当时仅有两种语言）。
 * 复刻该旧算法产物，供纯净判定识别存量恢复集——否则升级前点过恢复的用户
 * 会被误判为「自定义」，纯净自动跟随对这批用户失效。
 */
export function legacyRestoreCategories(lang: "zh" | "en"): Category[] {
  const base = defaultCategoriesFor(lang);
  const twin = lang === "zh" ? DEFAULT_CATEGORIES_EN : DEFAULT_CATEGORIES;
  for (const c of base) {
    const tw = twin.find((o) => o.id === c.id);
    if (!tw) continue;
    for (const cand of [tw.name, ...tw.aliases]) {
      if (!c.aliases.some((a) => a.trim().toLowerCase() === cand.trim().toLowerCase())) {
        c.aliases.push(cand);
      }
    }
  }
  return base;
}

/**
 * 单条纯净判定：该分类是否就是某语言的出厂形状——原始默认、当前四语恢复版、
 * 或 1.0.3/1.0.4 的双语恢复版中同 id 的条目。命中 = 用户从未动过这一条。
 */
export function isPristineDefaultCategory(cat: Category): boolean {
  for (const lang of ALL_LANGS) {
    const base = ALL_DEFAULT_CATEGORIES[lang].find((c) => c.id === cat.id);
    if (base && sameCategory(cat, base)) return true;
    const restored = defaultCategoriesForRestore(lang).find((c) => c.id === cat.id);
    if (restored && sameCategory(cat, restored)) return true;
  }
  for (const lang of ["zh", "en"] as const) {
    const legacy = legacyRestoreCategories(lang).find((c) => c.id === cat.id);
    if (legacy && sameCategory(cat, legacy)) return true;
  }
  return false;
}

export interface FollowResult {
  categories: Category[];
  /** 已跟随目标语言出厂形状的默认分类数（含本就是目标形状的）。 */
  followedCount: number;
  /** 用户新增或修改过而原样保留的条目数。 */
  keptCount: number;
  /** categories 与输入相比是否有实际变化。 */
  changed: boolean;
}

/**
 * 逐分类语言跟随（纯函数）：切换界面语言时，未被用户动过的默认分类替换为
 * 目标语言的恢复版（含跨语言关键词桥接，历史记录归类不变）；用户新增、修改
 * 或删除的痕迹全部尊重——新增条目原位保留、改过的条目一字不动、删掉的不复活。
 * 重名保护：替换结果若与某个保留条目重名（忽略大小写），该条放弃替换。
 * 被替换的只是出厂内容，切回原语言即还原，零数据损失。
 */
export function followCategoriesToLang(cats: Category[], target: Lang): FollowResult {
  const targetRestore = defaultCategoriesForRestore(target);
  const pristineFlags = cats.map((c) => isPristineDefaultCategory(c));
  const keptNames = new Set(
    cats.filter((_, i) => !pristineFlags[i]).map((c) => c.name.trim().toLowerCase()),
  );
  let followedCount = 0;
  let keptCount = 0;
  const categories = cats.map((c, i) => {
    if (!pristineFlags[i]) {
      keptCount++;
      return c;
    }
    const twin = targetRestore.find((o) => o.id === c.id);
    if (!twin || keptNames.has(twin.name.trim().toLowerCase())) {
      return c;
    }
    followedCount++;
    return { ...twin, aliases: [...twin.aliases] };
  });
  return { categories, followedCount, keptCount, changed: !sameCategorySet(categories, cats) };
}

/**
 * 按语言取整套默认设置（深拷贝）。仅用于全新安装的首次初始化。
 * 注意：记录文件名格式（"YYYY-M-D 时间记录.md"）是数据层约定，所有语言统一，
 * 不在此处本地化——否则切换界面语言会导致旧记录文件读不到。
 * ja/ko 的默认文件夹沿用英文 "Time Records"（文件名本就固定含「时间记录」，
 * 文件夹本地化收益低、只放大路径测试矩阵）。
 */
export function defaultSettingsFor(lang: Lang): TimeRecorderSettings {
  if (lang === "zh") {
    return { ...DEFAULT_SETTINGS, categories: defaultCategoriesFor("zh") };
  }
  return {
    version: DEFAULT_SETTINGS.version,
    language: "auto",
    recordsFolder: "Time Records",
    templatePath: "Time Records/timer template.md",
    flashNotePath: "",
    categories: defaultCategoriesFor(lang),
  };
}
