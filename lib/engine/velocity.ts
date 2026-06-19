/**
 * Velocity tracker — weighted average over recent pointer samples.
 * Pure function / class, no DOM/React deps. Unit-testable.
 *
 * Captures pointer positions over time and estimates lift-off velocity
 * using a time-weighted average of the last few samples (not a single delta).
 */

export interface PointerSample {
  x: number;
  y: number;
  t: number;  // timestamp in ms
}

/** Max age of samples we care about (ms) */
const MAX_AGE_MS = 100;
/** Minimum number of samples for a valid estimate */
const MIN_SAMPLES = 2;

/**
 * Add a new sample to a sample buffer (immutable — returns new array).
 * Trims samples older than MAX_AGE_MS relative to the newest.
 */
export function addSample(
  samples: PointerSample[],
  x: number,
  y: number,
  t: number
): PointerSample[] {
  const next = [...samples, { x, y, t }];
  const cutoff = t - MAX_AGE_MS;
  return next.filter(s => s.t >= cutoff);
}

/**
 * Estimate velocity (px/ms) at the end of the sample window.
 * Returns { vx, vy } in px/ms. Multiply by 1000 for px/s.
 *
 * Uses a simple time-weighted linear regression over the last N samples.
 * Falls back to the last two-point delta if insufficient samples.
 */
export function estimateVelocity(samples: PointerSample[]): { vx: number; vy: number } {
  if (samples.length < MIN_SAMPLES) return { vx: 0, vy: 0 };

  const n = samples.length;
  const last = samples[n - 1];

  // Use time-weighted average: weight = age from newest (more recent = higher weight)
  // Simple approach: use the last ~5 samples
  const window = samples.slice(-5);
  if (window.length < 2) return { vx: 0, vy: 0 };

  const first = window[0];
  const dt = last.t - first.t;
  if (dt <= 0) return { vx: 0, vy: 0 };

  // Compute weighted velocity using linear regression across the window
  let sumW = 0;
  let sumWVx = 0;
  let sumWVy = 0;

  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1];
    const curr = window[i];
    const segDt = curr.t - prev.t;
    if (segDt <= 0) continue;

    // Weight by recency: more recent segments get higher weight
    const age = last.t - curr.t;
    const weight = Math.exp(-age / 30); // exponential decay, 30ms half-life

    const segVx = (curr.x - prev.x) / segDt;
    const segVy = (curr.y - prev.y) / segDt;

    sumW += weight;
    sumWVx += weight * segVx;
    sumWVy += weight * segVy;
  }

  if (sumW === 0) return { vx: 0, vy: 0 };

  return { vx: sumWVx / sumW, vy: sumWVy / sumW };
}

/**
 * Convert px/ms velocity to px/s for display.
 */
export function toPixelsPerSecond(vMs: number): number {
  return vMs * 1000;
}

/**
 * Compute velocity magnitude in px/s from a sample array.
 */
export function velocityMagnitude(samples: PointerSample[]): number {
  const { vx, vy } = estimateVelocity(samples);
  return Math.sqrt(vx * vx + vy * vy) * 1000; // px/s
}
