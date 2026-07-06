/**
 * 把异步函数串行化：并发调用排队依次执行，杜绝交错。
 *
 * 背景：视图的 refresh/render 是「empty() → await 读文件 → 追加 DOM」，
 * 两次并发调用交错时，后一次的 empty() 只清掉前一次已渲染的部分，
 * 两次的正文都在各自 await 恢复后追加 → 内容重复显示。
 * （典型触发：手机端 Obsidian Sync 落盘一秒内多次 modify 事件 → refreshAll burst。）
 *
 * 串行化后无论内部有多少个 await、将来怎么改，都不可能交错。
 */
export function serialize(fn: () => Promise<void>): () => Promise<void> {
  let chain: Promise<void> = Promise.resolve();
  return () => {
    const next = chain.then(() => fn());
    // 本次失败不阻断后续调用（调用方仍能通过返回的 next 感知错误）
    chain = next.catch(() => {});
    return next;
  };
}
