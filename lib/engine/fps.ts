/**
 * FPS meter — measured from real rAF timestamps.
 * Pure computation, no DOM/React deps. Unit-testable.
 *
 * Maintains a rolling window of frame timestamps and computes:
 * - Instantaneous FPS (last frame delta)
 * - Smoothed FPS (rolling average)
 * - Per-frame budget use (delta vs target frame time)
 * - Whether a frame was dropped (delta > target * 1.5)
 */

export interface FpsState {
  /** Rolling window of rAF timestamps (ms) */
  timestamps: number[];
  /** Smoothed FPS (rolling average) */
  fps: number;
  /** Last frame delta (ms) */
  lastDeltaMs: number;
  /** Cumulative dropped frame count */
  droppedFrames: number;
}

/** How many timestamps to keep in the rolling window */
const WINDOW_SIZE = 30;

export function makeFpsState(): FpsState {
  return {
    timestamps: [],
    fps: 0,
    lastDeltaMs: 16.67,
    droppedFrames: 0,
  };
}

/**
 * Record a new rAF timestamp and update FPS state.
 *
 * @param state  previous FPS state
 * @param now    current rAF timestamp in ms (from `requestAnimationFrame`'s callback arg)
 * @param targetHz  60 or 120
 * @returns updated FPS state
 */
export function recordFrame(
  state: FpsState,
  now: number,
  targetHz: 60 | 120 = 60
): FpsState {
  const timestamps = [...state.timestamps, now].slice(-WINDOW_SIZE);
  const targetMs = 1000 / targetHz;

  let fps = state.fps;
  let lastDeltaMs = state.lastDeltaMs;
  let droppedFrames = state.droppedFrames;

  if (timestamps.length >= 2) {
    const n = timestamps.length;
    lastDeltaMs = timestamps[n - 1] - timestamps[n - 2];

    // Rolling FPS: total frames / total elapsed time over the window
    const elapsed = timestamps[n - 1] - timestamps[0];
    if (elapsed > 0) {
      fps = ((n - 1) / elapsed) * 1000;
    }

    // Count dropped frames: delta more than 1.5× the target frame time
    if (lastDeltaMs > targetMs * 1.5) {
      droppedFrames = state.droppedFrames + 1;
    }
  }

  return { timestamps, fps, lastDeltaMs, droppedFrames };
}

/**
 * Returns the frame budget usage as a 0–1 ratio.
 * > 1.0 means the frame blew the budget.
 */
export function budgetRatio(lastDeltaMs: number, targetHz: 60 | 120): number {
  const targetMs = 1000 / targetHz;
  return lastDeltaMs / targetMs;
}

/**
 * Whether the last frame blew the budget.
 */
export function isFrameDropped(lastDeltaMs: number, targetHz: 60 | 120): boolean {
  return budgetRatio(lastDeltaMs, targetHz) > 1.5;
}

/**
 * Simulate synthetic work (busy-loop for N ms).
 * ONLY called inside a rAF callback by the Lesson 06 demo.
 * Returns the actual elapsed time in ms.
 */
export function burnMs(ms: number): number {
  if (ms <= 0) return 0;
  const start = performance.now();
  const end = start + ms;
  // eslint-disable-next-line no-empty
  while (performance.now() < end) {}
  return performance.now() - start;
}
