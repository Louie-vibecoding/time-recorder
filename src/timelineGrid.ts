/**
 * 时间轴半小时刻度的纯逻辑（无 Obsidian 依赖，便于测试）。
 */

import { parseHHMM, formatHHMM, isOpenEnd } from "./time";
import { Segment } from "./types";

export interface HalfHourTick {
  minutes: number; // 距 00:00 的分钟数（0..1440）
  isHalf: boolean; // 是否半点（HH:30）
  label: string; // "HH:MM"，末条为 "24:00"
}

const HALF = 30;
const DAY_MIN = 24 * 60;
const PX_PER_MIN = 1; // 时间轴 PIXELS_PER_HOUR=60 → 1px/分钟

/**
 * 短段判定阈值（像素）。真实高度不足此值的段太矮，塞不下一行标签，
 * 改为把标签横排到色条右侧空白处（.tr-segment-short）。30px≈半小时≈一行字。
 */
export const SHORT_SEGMENT_THRESHOLD_PX = 30;

/**
 * 是否为短段：真实高度（1px/分钟）严格小于阈值。
 * 短段色块保持真实（矮）高度不重叠，标签外置到右侧（见 styles.css .tr-segment-short）。
 */
export function isShortSegment(
  startMin: number,
  endMin: number,
  thresholdPx: number,
): boolean {
  return (endMin - startMin) * PX_PER_MIN < thresholdPx;
}

/** 生成 49 条半小时刻度（0..48 × 30 分，含底部 24:00）。 */
export function halfHourGridTicks(): HalfHourTick[] {
  const ticks: HalfHourTick[] = [];
  for (let i = 0; i <= 48; i++) {
    const minutes = i * HALF;
    const isHalf = i % 2 === 1;
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = isHalf ? "30" : "00";
    ticks.push({ minutes, isHalf, label: `${hh}:${mm}` });
  }
  return ticks;
}

export interface EmptySlotFill {
  start: string;
  end: string;
}

/**
 * 点击时间轴空隙 → 计算新建段的默认 start/end（填满整条空隙）。
 * - start = 「结束时间 ≤ 点击位置」的段里结束最大者（紧挨上方块）；无则 00:00。
 * - end   = 「开始时间 > 点击位置」的段里开始最小者（紧挨下方块）；无则今天 now / 历史 24:00。
 * - 进行中段（isOpenEnd）的结束按渲染口径：今天 nowMin、历史/未来 1440。
 * - 兜底：若 end ≤ start（极端如点在今天未来空白）→ end = min(start+60, 1440)，保证 end>start。
 */
export function emptySlotFill(
  clickedMin: number,
  segments: Segment[],
  ctx: { isToday: boolean; nowMin: number },
): EmptySlotFill {
  const dayEnd = ctx.isToday ? ctx.nowMin : DAY_MIN;

  const effEnd = (s: Segment): number => (isOpenEnd(s.end) ? dayEnd : parseHHMM(s.end));

  let startMin = 0;
  for (const s of segments) {
    const e = effEnd(s);
    if (!isNaN(e) && e <= clickedMin && e > startMin) startMin = e;
  }

  let endMin = dayEnd;
  let hasBelow = false;
  for (const s of segments) {
    const st = parseHHMM(s.start);
    if (!isNaN(st) && st > clickedMin && (!hasBelow || st < endMin)) {
      endMin = st;
      hasBelow = true;
    }
  }

  if (endMin <= startMin) endMin = Math.min(startMin + 60, DAY_MIN);

  const start = formatHHMM(startMin);
  const end = endMin >= DAY_MIN ? "24:00" : formatHHMM(endMin);
  return { start, end };
}
