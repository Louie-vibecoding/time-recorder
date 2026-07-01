/**
 * 时间段编辑器的时间校验（纯逻辑，无 Obsidian 依赖，便于测试）。
 *
 * 约定：结束时间留空（或 ing / 00:00 旧兼容）= 段仍在进行中，写 "ing"、
 * 跳过结束校验——这样编辑进行中段时可只改开始时间。填了结束时间才校验。
 */
import { parseHHMM, isOpenEnd } from "./time";

export interface SegmentTimesValidation {
  ok: boolean;
  error?: string; // 校验失败原因（给 Notice）
  normalizedEnd?: string; // 校验通过时最终写入的 end（"ing" 或有效 "HH:MM"）
}

export function validateSegmentTimes(
  start: string,
  end: string,
): SegmentTimesValidation {
  const startMin = parseHHMM(start);
  if (isNaN(startMin)) {
    return { ok: false, error: "开始时间无效" };
  }

  const endRaw = end.trim();
  // 留空 / ing / 00:00（旧进行中兼容）→ 进行中，跳过结束校验
  if (endRaw === "" || isOpenEnd(endRaw)) {
    return { ok: true, normalizedEnd: "ing" };
  }

  const endMin = parseHHMM(endRaw);
  if (isNaN(endMin)) {
    return { ok: false, error: "结束时间无效" };
  }
  if (endMin <= startMin) {
    return { ok: false, error: "结束时间必须晚于开始时间" };
  }
  return { ok: true, normalizedEnd: endRaw };
}
