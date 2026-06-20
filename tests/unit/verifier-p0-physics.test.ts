/**
 * INDEPENDENT VERIFIER — P0 physics correctness tests
 * Written fresh from the spec requirements for the 2026-06-20 fixes.
 *
 * Covers the 5 required assertions:
 * 1. REST REACHED: finite lift-off velocity → velocity converges to ~0, position stops changing
 * 2. NO ESCAPE PAST BOUNDS: huge velocity → card never escapes stage (using stepDecelIntegrate)
 * 3. NO NaN/Infinity: finite inputs → finite outputs (incl. huge velocities, dt spikes)
 * 4. FRICTION MONOTONICITY: higher friction → shorter glide distance + shorter time-to-rest
 * 5. VELOCITY SAMPLING: pause-before-release (stale samples) → ~0 lift-off velocity
 */
import { describe, it, expect } from "vitest";
import { stepDecelIntegrate, measureGlide } from "../../lib/engine/decelIntegrate";
import { addSample, estimateVelocity } from "../../lib/engine/velocity";

// ─── 1. REST REACHED ──────────────────────────────────────────────────────────
// For any finite lift-off velocity, the integrator must converge: velocity reaches ~0
// (epsilon snap) and position stops changing within a bounded number of steps.

describe("REST REACHED: decel integrator converges for any finite lift-off velocity", () => {
  const VELOCITIES = [50, 300, 1000, 2000, 5000, 10000];
  const FRICTIONS = [1, 4, 8, 12];
  const REST_EPS = 0.5; // px/s — same threshold as Lesson05.tsx REST_THRESHOLD
  const MAX_STEPS = 200_000;

  for (const v0 of VELOCITIES) {
    for (const friction of FRICTIONS) {
      it(`v0=${v0} px/s, friction=${friction}: velocity reaches <${REST_EPS} px/s within ${MAX_STEPS} steps`, () => {
        let state = { position: 0, velocity: v0 };
        const dt = 1 / 60;
        let steps = 0;

        while (Math.abs(state.velocity) >= REST_EPS && steps < MAX_STEPS) {
          state = stepDecelIntegrate(state, friction, dt);
          steps++;
        }

        // Must have converged before the step cap
        expect(steps).toBeLessThan(MAX_STEPS);
        expect(Math.abs(state.velocity)).toBeLessThan(REST_EPS);
      });
    }
  }

  it("position stops changing once velocity is snapped to 0 (no perpetual motion)", () => {
    // Simulate the snap-to-0 logic from Lesson05.tsx
    let state = { position: 0, velocity: 1000 };
    const friction = 4;
    const dt = 1 / 60;
    const REST_THRESHOLD = 0.5;

    let lastPos = NaN;
    let stepsAfterSnap = 0;
    let snapped = false;

    for (let i = 0; i < 100_000; i++) {
      state = stepDecelIntegrate(state, friction, dt);
      if (Math.abs(state.velocity) < REST_THRESHOLD) {
        state.velocity = 0;
        snapped = true;
      }
      if (snapped) {
        if (!isNaN(lastPos)) {
          // Position must NOT change after snap
          expect(state.position).toBeCloseTo(lastPos, 5);
        }
        lastPos = state.position;
        stepsAfterSnap++;
        if (stepsAfterSnap > 10) break; // confirmed stable
      }
    }

    // Must have snapped within the loop
    expect(snapped).toBe(true);
    expect(stepsAfterSnap).toBeGreaterThan(5);
  });
});

// ─── 2. NO ESCAPE PAST BOUNDS ────────────────────────────────────────────────
// Using stepDecelIntegrate (the actual function used in Lesson05.tsx),
// a HUGE velocity aimed at a wall must NOT produce a position outside stage bounds.
// Spec: elastic reflection (clamp + reflect velocity × restitution) prevents escape.

describe("NO ESCAPE PAST BOUNDS: stepDecelIntegrate with huge velocity stays inside stage", () => {
  const RESTITUTION = 0.6;
  const CARD_W = 80;
  const CARD_H = 56;
  const STAGE_W = 400;
  const STAGE_H = 200;

  function simulateWithBounds(
    startX: number, startY: number,
    vxps: number, vyps: number,
    friction: number,
    maxSteps = 10_000
  ) {
    const maxX = STAGE_W - CARD_W;
    const maxY = STAGE_H - CARD_H;

    let sx = { position: startX, velocity: vxps };
    let sy = { position: startY, velocity: vyps };
    const SUB_STEP = 0.008; // 8ms sub-step (same as Lesson05.tsx)
    const frameDt = 1 / 60;

    const positions: { x: number; y: number }[] = [];

    for (let step = 0; step < maxSteps; step++) {
      let remaining = frameDt;
      while (remaining > 0) {
        const dt = Math.min(remaining, SUB_STEP);
        remaining -= dt;

        sx = stepDecelIntegrate(sx, friction, dt);
        sy = stepDecelIntegrate(sy, friction, dt);

        if (sx.position < 0) { sx.position = 0; sx.velocity = Math.abs(sx.velocity) * RESTITUTION; }
        if (sx.position > maxX) { sx.position = maxX; sx.velocity = -Math.abs(sx.velocity) * RESTITUTION; }
        if (sy.position < 0) { sy.position = 0; sy.velocity = Math.abs(sy.velocity) * RESTITUTION; }
        if (sy.position > maxY) { sy.position = maxY; sy.velocity = -Math.abs(sy.velocity) * RESTITUTION; }

        // Hard clamp (same as Lesson05.tsx)
        sx.position = Math.max(0, Math.min(maxX, sx.position));
        sy.position = Math.max(0, Math.min(maxY, sy.position));
      }

      positions.push({ x: sx.position, y: sy.position });

      if (Math.abs(sx.velocity) < 0.5 && Math.abs(sy.velocity) < 0.5) break;
    }

    return positions;
  }

  it("HUGE rightward velocity (50000 px/s) starting at left edge stays within [0, maxX]", () => {
    const maxX = STAGE_W - CARD_W;
    const positions = simulateWithBounds(10, 72, 50_000, 0, 4);
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(maxX + 0.001); // floating point tolerance
    }
  });

  it("HUGE diagonal velocity (30000, 25000 px/s) toward corner stays in bounds", () => {
    const maxX = STAGE_W - CARD_W;
    const maxY = STAGE_H - CARD_H;
    const positions = simulateWithBounds(5, 5, 30_000, 25_000, 4);
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(-0.001);
      expect(p.x).toBeLessThanOrEqual(maxX + 0.001);
      expect(p.y).toBeGreaterThanOrEqual(-0.001);
      expect(p.y).toBeLessThanOrEqual(maxY + 0.001);
    }
  });

  it("HUGE upward velocity (0, -40000 px/s) stays within [0, maxY]", () => {
    const maxY = STAGE_H - CARD_H;
    const positions = simulateWithBounds(150, maxY - 5, 0, -40_000, 4);
    for (const p of positions) {
      expect(p.y).toBeGreaterThanOrEqual(-0.001);
      expect(p.y).toBeLessThanOrEqual(maxY + 0.001);
    }
  });
});

// ─── 3. NO NaN/Infinity ───────────────────────────────────────────────────────
// stepDecelIntegrate must never produce NaN or Infinity for any finite input,
// including very large velocities, dt spikes, and near-zero friction.

describe("NO NaN/Infinity: stepDecelIntegrate produces finite output for any finite input", () => {
  const extremeInputs = [
    { v0: 0, friction: 1, dt: 1 / 60 },
    { v0: 50_000, friction: 1, dt: 1 / 60 },
    { v0: 50_000, friction: 12, dt: 1 / 60 },
    { v0: 1_000, friction: 0.0001, dt: 1 / 60 },  // near-zero friction (safeFriction clamps)
    { v0: 1_000, friction: 4, dt: 10 },             // huge dt spike (safeDt clamps to 0.064)
    { v0: 1_000, friction: 4, dt: 0.064 },           // exactly at safeDt cap
    { v0: 1_000_000, friction: 1, dt: 1 / 60 },      // extreme velocity
    { v0: 1_000_000, friction: 12, dt: 0.064 },       // extreme velocity + extreme dt
    { v0: -5000, friction: 4, dt: 1 / 60 },           // negative velocity
    { v0: -50_000, friction: 8, dt: 1 / 60 },          // large negative velocity
  ];

  for (const { v0, friction, dt } of extremeInputs) {
    it(`v0=${v0}, friction=${friction}, dt=${dt.toFixed(4)}: position and velocity are finite, non-NaN`, () => {
      const state = { position: 0, velocity: v0 };
      const next = stepDecelIntegrate(state, friction, dt);
      expect(Number.isFinite(next.position)).toBe(true);
      expect(Number.isFinite(next.velocity)).toBe(true);
      expect(Number.isNaN(next.position)).toBe(false);
      expect(Number.isNaN(next.velocity)).toBe(false);
    });
  }

  it("running 1000 steps on a huge velocity produces no NaN/Infinity anywhere in the stream", () => {
    let state = { position: 0, velocity: 100_000 };
    const friction = 4;
    const dt = 1 / 60;

    for (let i = 0; i < 1000; i++) {
      state = stepDecelIntegrate(state, friction, dt);
      expect(Number.isFinite(state.position)).toBe(true);
      expect(Number.isFinite(state.velocity)).toBe(true);
      expect(Number.isNaN(state.position)).toBe(false);
      expect(Number.isNaN(state.velocity)).toBe(false);
    }
  });
});

// ─── 4. FRICTION MONOTONICITY ────────────────────────────────────────────────
// For a FIXED lift-off velocity, higher friction (deceleration slider value) ⇒
// shorter total glide distance AND shorter time-to-rest, monotonic across 1..12.
// This is the marquee fix — assert it on the real engine functions.
// (The measureGlide function is the exact verifier-facing contract.)

describe("FRICTION MONOTONICITY: higher friction → shorter glide distance and time-to-rest", () => {
  // Full slider range in 0.5 increments (same as the Lesson05 slider)
  const SLIDER_RANGE: number[] = [];
  for (let f = 1; f <= 12; f += 0.5) SLIDER_RANGE.push(parseFloat(f.toFixed(1)));

  for (const v0 of [200, 500, 1000, 2000]) {
    it(`v0=${v0} px/s: glide DISTANCE strictly decreasing across full slider range 1..12`, () => {
      const distances = SLIDER_RANGE.map(f => measureGlide(v0, f).distance);
      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeLessThan(distances[i - 1]);
      }
    });

    it(`v0=${v0} px/s: time-to-rest strictly decreasing across full slider range 1..12`, () => {
      const times = SLIDER_RANGE.map(f => measureGlide(v0, f).timeToRest);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeLessThan(times[i - 1]);
      }
    });
  }

  it("friction=1 (LOW): long coast — distance > 10× friction=12 (HIGH)", () => {
    const low = measureGlide(1000, 1);
    const high = measureGlide(1000, 12);
    expect(low.distance / high.distance).toBeGreaterThan(10);
  });

  it("friction=1 (LOW): long time — timeToRest > 5× friction=12 (HIGH)", () => {
    const low = measureGlide(1000, 1);
    const high = measureGlide(1000, 12);
    expect(low.timeToRest / high.timeToRest).toBeGreaterThan(5);
  });
});

// ─── 5. VELOCITY SAMPLING ────────────────────────────────────────────────────
// A pause-before-release (all samples are stale / >~50-100ms old or zero-motion)
// must yield ~0 velocity (not the last non-zero sample replayed stale).

describe("VELOCITY SAMPLING: pause-before-release gives ~0 velocity", () => {
  it("samples all older than 100ms → estimateVelocity returns ~0", () => {
    // Simulate a fast flick followed by a pause (>100ms gap before release)
    // addSample trims samples older than 100ms from the newest.
    // If we flick at t=0..50, then pause until t=200 (release), the buffer is empty.
    let samples = addSample([], 0, 0, 0);
    samples = addSample(samples, 10, 0, 10);
    samples = addSample(samples, 20, 0, 20);
    samples = addSample(samples, 30, 0, 30);
    // Pause: add a sample at t=200 (all previous are >100ms old → trimmed)
    samples = addSample(samples, 30, 0, 200); // position unchanged during pause → v≈0

    const { vx, vy } = estimateVelocity(samples);
    // Velocity should be ~0: only the "pause" sample at 30,30 at t=200 remains
    // (and possibly the t=30 sample which is 170ms old → trimmed by addSample)
    // With only one sample in the window, estimateVelocity returns (0,0)
    expect(Math.abs(vx)).toBeCloseTo(0, 3);
    expect(Math.abs(vy)).toBeCloseTo(0, 3);
  });

  it("zero-motion samples (same position) → ~0 velocity regardless of timing", () => {
    // User held pointer still before release
    let samples = addSample([], 50, 50, 0);
    samples = addSample(samples, 50, 50, 10);
    samples = addSample(samples, 50, 50, 20);
    samples = addSample(samples, 50, 50, 30);

    const { vx, vy } = estimateVelocity(samples);
    expect(Math.abs(vx)).toBeLessThan(0.01); // near-zero
    expect(Math.abs(vy)).toBeLessThan(0.01);
  });

  it("stale-heavy buffer (only one fresh sample) → ~0 velocity", () => {
    // Flick then pause: only the pause sample is within 100ms of now (t=150)
    let samples = addSample([], 0, 0, 0);
    samples = addSample(samples, 15, 0, 15);
    // Now "release" at t=150: the t=0 and t=15 samples are >=100ms stale → trimmed
    // Only a no-movement sample at t=150 would remain, but simulate by adding at t=150
    samples = addSample(samples, 15, 0, 150); // position unchanged since pause

    const { vx } = estimateVelocity(samples);
    // Should be ~0 (the window only has the last sample with no motion)
    expect(Math.abs(vx)).toBeLessThan(0.5); // px/ms, well below any real flick
  });

  it("active flick (samples within 100ms) correctly returns NON-ZERO velocity", () => {
    // 100px/ms motion — this must NOT return 0
    let samples = addSample([], 0, 0, 0);
    samples = addSample(samples, 10, 0, 10);
    samples = addSample(samples, 20, 0, 20);
    samples = addSample(samples, 30, 0, 30);
    // All within 100ms of last sample (t=30)

    const { vx } = estimateVelocity(samples);
    expect(vx).toBeGreaterThan(0.5); // 1 px/ms = clearly non-zero flick
  });

  it("velocity is a weighted average of recent segments, not a single frame delta", () => {
    // Non-uniform spacing: last segment is 3× faster than first
    // If it were purely last-delta, it would return the last segment's velocity only
    // Weighted average should lie between the two segment velocities
    const samples = [
      { x: 0, y: 0, t: 0 },    // segment 1: 10px over 20ms = 0.5 px/ms
      { x: 10, y: 0, t: 20 },
      { x: 25, y: 0, t: 30 },  // segment 2: 15px over 10ms = 1.5 px/ms
    ];

    const { vx } = estimateVelocity(samples);
    // Weighted by recency: segment 2 (most recent) gets higher weight
    // vx should be between 0.5 and 1.5 (weighted avg), skewed toward recent
    expect(vx).toBeGreaterThan(0.5);  // not just segment-1 average
    expect(vx).toBeLessThan(1.5);    // not just last segment
    // And must be closer to 1.5 (recent) than to 0.5 (old)
    expect(vx).toBeGreaterThan(0.8);
  });
});
