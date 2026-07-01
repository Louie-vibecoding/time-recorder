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

/** 色块最小高度（像素）= 半小时。短段撑到此高度以放下一行标签文字。 */
export const MIN_SEGMENT_HEIGHT_PX = 30;

/**
 * 色块渲染高度：真实时长高度（1px/分钟）与 minPx 取大。
 * 短段被撑到 minPx，保证标签文字放得下。
 */
export function blockHeight(
  startMin: number,
  endMin: number,
  minPx: number,
): number {
  return Math.max((endMin - startMin) * PX_PER_MIN, minPx);
}

/**
 * 是否为被撑高的短段：真实高度严格小于 minPx。
 * 用于给块加 .tr-segment-short（抬 z-index 浮到下一段之上）。
 */
export function isShortSegment(
  startMin: number,
  endMin: number,
  minPx: number,
): boolean {
  return (endMin - startMin) * PX_PER_MIN < minPx;
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
