import test from "node:test";
import assert from "node:assert/strict";
import { runSpriteClock, type ClockTimer } from "../src/sprite-clock.ts";

/** 手动时钟：不依赖真实定时器，可以精确断言「排了几拍、每拍多长」。 */
function manualClock() {
  let now = 0;
  let seq = 0;
  const queued = new Map<number, { at: number; callback: () => void }>();
  const timer: ClockTimer = {
    setTimeout(callback, delay) {
      seq += 1;
      queued.set(seq, { at: now + delay, callback });
      return seq;
    },
    clearTimeout(id) {
      queued.delete(id);
    },
  };
  return {
    timer,
    get pending() {
      return queued.size;
    },
    /** 推进时间并触发到点的回调。 */
    tick(ms: number) {
      const target = now + ms;
      for (;;) {
        const due = [...queued.entries()]
          .filter(([, entry]) => entry.at <= target)
          .sort((left, right) => left[1].at - right[1].at)[0];
        if (!due) break;
        queued.delete(due[0]);
        now = due[1].at;
        due[1].callback();
      }
      now = target;
    },
  };
}

test("按每格时长推进，循环回到第 0 帧", () => {
  const clock = manualClock();
  const frames: number[] = [];
  let hidden = false;
  let resume = () => {};
  const stop = runSpriteClock({
    durations: [10, 20],
    animate: true,
    timer: clock.timer,
    hidden: () => hidden,
    onVisible: (listener) => {
      resume = listener;
      return () => {};
    },
    onFrame: (frame) => frames.push(frame),
  });
  assert.equal(clock.pending, 1);
  clock.tick(9);
  assert.deepEqual(frames, []);
  clock.tick(1);
  assert.deepEqual(frames, [1]);
  clock.tick(20);
  assert.deepEqual(frames, [1, 0]);
  clock.tick(10);
  assert.deepEqual(frames, [1, 0, 1]);
  stop();
  assert.equal(clock.pending, 0);
  void resume;
});

test("标签页隐藏后不再排队，恢复可见时重新接上", () => {
  const clock = manualClock();
  const frames: number[] = [];
  let hidden = false;
  let resume = () => {};
  const stop = runSpriteClock({
    durations: [10, 20],
    animate: true,
    timer: clock.timer,
    hidden: () => hidden,
    onVisible: (listener) => {
      resume = listener;
      return () => {};
    },
    onFrame: (frame) => frames.push(frame),
  });
  // 隐藏期间那一拍到期：不推进，也不再排下一拍（这就是「隐藏不产生回调」的保证）。
  hidden = true;
  clock.tick(10);
  assert.deepEqual(frames, []);
  assert.equal(clock.pending, 0);
  clock.tick(5000);
  assert.deepEqual(frames, []);
  assert.equal(clock.pending, 0);
  // 恢复可见：从当前帧继续。
  hidden = false;
  resume();
  assert.equal(clock.pending, 1);
  clock.tick(10);
  assert.deepEqual(frames, [1]);
  stop();
  assert.equal(clock.pending, 0);
});

test("静态姿势与减少动画时不启动任何定时器", () => {
  const clock = manualClock();
  const stop = runSpriteClock({
    durations: [10],
    animate: false,
    timer: clock.timer,
    hidden: () => false,
    onVisible: () => () => {},
    onFrame: () => {
      throw new Error("不应推进帧");
    },
  });
  assert.equal(clock.pending, 0);
  clock.tick(1000);
  stop();
});

test("起始即隐藏时只订阅可见性，不排队", () => {
  const clock = manualClock();
  const frames: number[] = [];
  let hidden = true;
  let resume = () => {};
  let unsubscribed = false;
  const stop = runSpriteClock({
    durations: [10, 20],
    animate: true,
    timer: clock.timer,
    hidden: () => hidden,
    onVisible: (listener) => {
      resume = listener;
      return () => {
        unsubscribed = true;
      };
    },
    onFrame: (frame) => frames.push(frame),
  });
  assert.equal(clock.pending, 0);
  hidden = false;
  resume();
  clock.tick(10);
  assert.deepEqual(frames, [1]);
  stop();
  assert.equal(clock.pending, 0);
  assert.equal(unsubscribed, true);
  // 停止后再恢复也不能再推进。
  resume();
  clock.tick(100);
  assert.deepEqual(frames, [1]);
});
