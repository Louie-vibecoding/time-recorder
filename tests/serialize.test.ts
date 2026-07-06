import { describe, it, expect } from "vitest";
import { serialize } from "../src/serialize";

/** 模拟一次「empty → await 读文件 → 追加 DOM」型的异步任务，记录执行交错情况 */
function makeTracedTask(log: string[], label: string, delayMs: number) {
  return async () => {
    log.push(`start-${label}`);
    await new Promise((r) => setTimeout(r, delayMs));
    log.push(`end-${label}`);
  };
}

describe("serialize", () => {
  it("并发调用不交错：前一次完整跑完，后一次才开始（防重复渲染竞态）", async () => {
    const log: string[] = [];
    let call = 0;
    const fn = serialize(async () => {
      const label = String(++call);
      await makeTracedTask(log, label, 10)();
    });
    // 模拟 Obsidian Sync burst：两次 modify 事件几乎同时触发 refresh
    await Promise.all([fn(), fn()]);
    expect(log).toEqual(["start-1", "end-1", "start-2", "end-2"]);
  });

  it("排队的每次调用都会执行（不丢刷新）", async () => {
    let runs = 0;
    const fn = serialize(async () => {
      runs++;
      await new Promise((r) => setTimeout(r, 5));
    });
    await Promise.all([fn(), fn(), fn()]);
    expect(runs).toBe(3);
  });

  it("前一次抛错不阻断后一次（刷新失败可自愈）", async () => {
    const results: string[] = [];
    let call = 0;
    const fn = serialize(async () => {
      call++;
      if (call === 1) throw new Error("boom");
      results.push("ok");
    });
    await expect(fn()).rejects.toThrow("boom");
    await fn();
    expect(results).toEqual(["ok"]);
  });

  it("返回的 promise 对应本次执行完成", async () => {
    let done = false;
    const fn = serialize(async () => {
      await new Promise((r) => setTimeout(r, 10));
      done = true;
    });
    await fn();
    expect(done).toBe(true);
  });
});
