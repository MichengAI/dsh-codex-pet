/**
 * 精灵帧时钟：按每格的显示时长推进，标签页隐藏时整段停下（不排队任何定时器），
 * 恢复可见后从当前帧接着走。
 *
 * 抽成纯函数是为了能脱离 React 与浏览器单测：定时器、可见性都从外部注入。
 */
export interface ClockTimer {
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(id: number): void;
}

export interface SpriteClockOptions {
  /** 每格显示时长（毫秒），长度即循环帧数。 */
  durations: readonly number[];
  /** 是否需要动：静态姿势、注视中或 reduce-motion 时为 false，整段不启动。 */
  animate: boolean;
  timer: ClockTimer;
  hidden(): boolean;
  /** 订阅可见性变化，回调里负责重新接上时钟；返回取消订阅函数。 */
  onVisible(resume: () => void): () => void;
  /** 推进到下一帧时回调（首帧由调用方自己画）。 */
  onFrame(frame: number): void;
}

/** 启动时钟，返回停止函数（幂等）。 */
export function runSpriteClock(options: SpriteClockOptions): () => void {
  const { durations, timer, hidden, onVisible, onFrame } = options;
  const count = durations.length;
  let frame = 0;
  let handle: number | null = null;
  let live = true;
  const stop = (): void => {
    if (handle === null) return;
    timer.clearTimeout(handle);
    handle = null;
  };
  const advance = (): void => {
    handle = timer.setTimeout(() => {
      handle = null;
      // 隐藏期间既不推进也不续排：可见性回调会重新接上。
      if (!live || hidden()) return;
      frame = (frame + 1) % count;
      onFrame(frame);
      advance();
    }, durations[frame] ?? 0);
  };
  const resume = (): void => {
    if (!live || hidden()) return;
    stop();
    advance();
  };
  const off = onVisible(resume);
  if (options.animate && count > 0 && !hidden()) advance();
  return () => {
    live = false;
    off();
    stop();
  };
}
