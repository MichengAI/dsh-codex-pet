/** E2E 启动使用统一墙钟预算，等待和每次尝试共享同一截止时间。 */
export async function retryStartup({ start, retryable, onRetry = () => {}, budget = 120000, now = () => performance.now(), sleep = ms => new Promise(done => setTimeout(done, ms)) }) {
  const deadline = now() + budget;
  let cause, attempt = 0;
  while (now() < deadline) {
    try { return await start(deadline); }
    catch (error) {
      cause = error;
      if (!retryable(error)) throw error;
      if (deadline - now() <= 5000) break;
      onRetry(++attempt);
      await sleep(5000);
    }
  }
  throw new Error(`DSH 启动预算 ${budget}ms 已耗尽或不足以重试：${String(cause)}`, { cause });
}

/** 所有清理步骤都执行；追加错误而不覆盖测试失败。 */
export async function finishReport(report, steps) {
  for (const step of steps) {
    try { await step(); }
    catch (error) { report.cleanupErrors.push(String(error)); }
  }
}
