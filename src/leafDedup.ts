/**
 * 把同类型的多个视图 leaf 收敛成一个：保留第一个，其余视为重复。
 * 纯函数、无 Obsidian 依赖，便于测试。调用方负责对 extras 执行 detach()。
 */
export function splitDuplicateLeaves<T>(leaves: T[]): { keep: T | null; extras: T[] } {
  if (leaves.length === 0) return { keep: null, extras: [] };
  return { keep: leaves[0], extras: leaves.slice(1) };
}
