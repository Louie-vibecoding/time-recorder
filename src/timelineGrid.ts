/**
 * 时间轴半小时刻度的纯逻辑（无 Obsidian 依赖，便于测试）。
 */

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

/**
 * 点空白新建段时，把点击分钟吸附到最近半小时。
 * 四舍五入到 30 分；下限 0、上限 23:30（避免落到 24:00 让 start=end）。
 */
export function snapStartToHalfHour(clickedMin: number): number {
  const snapped = Math.round(clickedMin / HALF) * HALF;
  return Math.max(0, Math.min(snapped, DAY_MIN - HALF));
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
