/**
 * Independent verifier unit tests — math correctness checks.
 * Each assertion is derived by hand and checks that the engine is HONEST.
 */
import { describe, it, expect } from "vitest";
import { stepSpring, makeSpringState, isAtRest } from "../../lib/engine/spring";
import { addSample, estimateVelocity, velocityMagnitude } from "../../lib/engine/velocity";
import { stepDecel, restPosition, isDecelDone } from "../../lib/engine/decel";
import { recordFrame, budgetRatio, isFrameDropped, makeFpsState } from "../../lib/engine/fps";

// ============================================================
// SPRING — convergence, damping correctness, energy stability
// ============================================================

describe("spring math honesty", () => {
  it("converges to target = 200 within 2% after 300 steps (overdamped)", () => {
    let state = makeSpringState(0);
    const params = { mass: 1, stiffness: 180, damping: 30 };
    for (let i = 0; i < 300; i++) {
      state = stepSpring(state, params, 200, 0.016);
    }
    expect(Math.abs(state.position - 200)).toBeLessThan(4); // within 2%
    expect(Math.abs(state.velocity)).toBeLessThan(1);
  });

  it("critically-damped spring settles faster than highly underdamped (same stiffness)", () => {
    // Count steps to settle within 0.5px for near-critical vs highly underdamped
    function stepsToSettle(damping: number): number {
      let state = makeSpringState(0);
      const params = { mass: 1, stiffness: 180, damping };
      for (let i = 0; i < 2000; i++) {
        state = stepSpring(state, params, 100, 0.016);
        if (isAtRest(state, 100, 0.5)) return i;
      }
      return 2000;
    }
    // damping=26 is near-critical (critical = 2*sqrt(mass*stiff) = 2*sqrt(180)≈26.8)
    // damping=5 is highly underdamped and oscillates for a long time
    const nearCriticalSteps = stepsToSettle(26);
    const highlyUnderdampedSteps = stepsToSettle(5);
    // Highly underdamped (5) oscillates longer before settling
    expect(highlyUnderdampedSteps).toBeGreaterThan(nearCriticalSteps);
  });

  it("higher damping yields less overshoot than lower damping", () => {
    function maxOvershoot(damping: number): number {
      let state = makeSpringState(0);
      const params = { mass: 1, stiffness: 180, damping };
      let max = 0;
      for (let i = 0; i < 300; i++) {
        state = stepSpring(state, params, 100, 0.016);
        if (state.position > 100) max = Math.max(max, state.position - 100);
      }
      return max;
    }
    const highDampOvershoot = maxOvershoot(40);  // nearly overdamped
    const lowDampOvershoot = maxOvershoot(5);    // highly underdamped
    expect(lowDampOvershoot).toBeGreaterThan(highDampOvershoot);
  });

  it("energy doesn't blow up: position stays within 3x target after 1000 steps (underdamped)", () => {
    let state = makeSpringState(0);
    const params = { mass: 1, stiffness: 500, damping: 5 };
    for (let i = 0; i < 1000; i++) {
      state = stepSpring(state, params, 100, 0.016);
    }
    // Semi-implicit Euler for underdamped spring can be unstable; verify bounded
    // We allow 3x target as a generous bound — true blowup would be 1e6+
    expect(Math.abs(state.position)).toBeLessThan(300);
    expect(Number.isFinite(state.position)).toBe(true);
  });

  it("spring started AT target stays at target (zero displacement, zero velocity)", () => {
    const state = makeSpringState(100);
    const params = { mass: 1, stiffness: 180, damping: 20 };
    const next = stepSpring(state, params, 100, 0.016);
    // No force at target with zero velocity: should remain exactly at 100
    expect(next.position).toBeCloseTo(100, 8);
    expect(next.velocity).toBeCloseTo(0, 8);
  });
});

// ============================================================
// VELOCITY — hand-computed expected values
// ============================================================

describe("velocity math honesty", () => {
  /**
   * Hand-computed: 3 samples at x=0,10,20 at t=0,10,20ms
   * Two segments each: (10-0)/(10-0)=1.0 px/ms, (20-10)/(20-10)=1.0 px/ms
   * Weight for segment 1 (curr=t10): age = 20-10=10, w = exp(-10/30) = exp(-0.333) ≈ 0.7165
   * Weight for segment 2 (curr=t20): age = 20-20=0,  w = exp(0/30)   = 1.0
   * Weighted vx = (0.7165*1 + 1.0*1) / (0.7165 + 1.0) = 1.7165/1.7165 = 1.0 px/ms exactly
   */
  it("uniform rightward motion at 1 px/ms gives vx=1 px/ms", () => {
    const samples = [
      { x: 0, y: 0, t: 0 },
      { x: 10, y: 0, t: 10 },
      { x: 20, y: 0, t: 20 },
    ];
    const { vx, vy } = estimateVelocity(samples);
    expect(vx).toBeCloseTo(1.0, 3);
    expect(Math.abs(vy)).toBeLessThan(0.01);
  });

  /**
   * Hand-computed for diagonal: x=0→5, y=0→5 over t=0→10ms
   * Both components = 0.5 px/ms → magnitude = sqrt(0.5^2+0.5^2)*1000 = sqrt(0.5)*1000 ≈ 707 px/s
   */
  it("diagonal motion at 0.5 px/ms yields magnitude ≈707 px/s", () => {
    const samples = [
      { x: 0, y: 0, t: 0 },
      { x: 5, y: 5, t: 10 },
    ];
    const mag = velocityMagnitude(samples);
    expect(mag).toBeCloseTo(Math.sqrt(0.5) * 1000, 0);
  });

  it("fast samples yield larger velocity magnitude than slow samples (same displacement)", () => {
    // 100px in 10ms vs 100px in 100ms
    const fast = [
      { x: 0, y: 0, t: 0 },
      { x: 100, y: 0, t: 10 },
    ];
    const slow = [
      { x: 0, y: 0, t: 0 },
      { x: 100, y: 0, t: 100 },
    ];
    const fastMag = velocityMagnitude(fast);
    const slowMag = velocityMagnitude(slow);
    expect(fastMag).toBeGreaterThan(slowMag);
  });

  it("velocity direction is correct: negative x for leftward motion", () => {
    const samples = [
      { x: 100, y: 50, t: 0 },
      { x: 80, y: 50, t: 20 },
    ];
    const { vx, vy } = estimateVelocity(samples);
    expect(vx).toBeLessThan(0);
    expect(Math.abs(vy)).toBeLessThan(0.01);
  });

  it("addSample trims samples >100ms old relative to newest", () => {
    const samples = [
      { x: 0, y: 0, t: 0 },
      { x: 1, y: 0, t: 50 },
      { x: 2, y: 0, t: 99 },
    ];
    // Add at t=150: cutoff = 150-100 = 50; t=0 is trimmed, t=50 and t=99 kept
    const result = addSample(samples, 3, 0, 150);
    expect(result.some(s => s.t === 0)).toBe(false);
    expect(result.some(s => s.t === 50)).toBe(true);
    expect(result.some(s => s.t === 99)).toBe(true);
    expect(result.some(s => s.t === 150)).toBe(true);
  });
});

// ============================================================
// DECEL — rest-distance monotone with initial velocity
// ============================================================

describe("decel math honesty", () => {
  /**
   * restPosition formula: x0 + v0/friction
   * v0=200, friction=5 → rest at 200/5=40px from start
   */
  it("rest position is exactly v0/friction away (analytical formula)", () => {
    const v0 = 200;
    const friction = 5;
    const rest = restPosition(0, v0, friction);
    expect(rest).toBeCloseTo(v0 / friction, 5);
  });

  it("higher initial velocity → longer rest distance (same friction)", () => {
    const friction = 5;
    const d100 = restPosition(0, 100, friction);
    const d300 = restPosition(0, 300, friction);
    expect(d300).toBeGreaterThan(d100);
  });

  it("higher friction → shorter rest distance (same initial velocity)", () => {
    const v0 = 200;
    const dLow = restPosition(0, v0, 2);
    const dHigh = restPosition(0, v0, 10);
    expect(dHigh).toBeLessThan(dLow);
  });

  it("velocity monotonically decreasing (friction always positive)", () => {
    let state = { position: 0, velocity: 300 };
    const friction = 5;
    let prev = state.velocity;
    for (let i = 0; i < 100; i++) {
      const next = stepDecel(state, friction, 0.016);
      expect(next.velocity).toBeLessThan(prev);
      expect(next.velocity).toBeGreaterThanOrEqual(0);
      state = next;
      prev = next.velocity;
    }
  });

  it("stepped decel position after 1 step matches analytical formula", () => {
    // x(dt) = x0 + v0/f * (1 - e^(-f*dt))
    const v0 = 200;
    const f = 5;
    const dt = 0.016;
    const state = { position: 0, velocity: v0 };
    const next = stepDecel(state, f, dt);
    const expected = (v0 / f) * (1 - Math.exp(-f * dt));
    expect(next.position).toBeCloseTo(expected, 5);
  });

  it("isDecelDone triggers once velocity drops below 0.5 px/s", () => {
    let state = { position: 0, velocity: 300 };
    for (let i = 0; i < 1000; i++) {
      state = stepDecel(state, 5, 0.016);
      if (Math.abs(state.velocity) < 0.5) {
        expect(isDecelDone(state)).toBe(true);
        return;
      }
    }
    // Should have stopped well before 1000 steps
    throw new Error("decel never stopped");
  });
});

// ============================================================
// FPS — honest budget classification
// ============================================================

describe("fps math honesty", () => {
  /**
   * At 60Hz: budget = 16.67ms. Drop threshold = 16.67 * 1.5 = 25ms.
   * 10ms delta → not dropped.
   * 33ms delta → dropped (33 > 25).
   */
  it("10ms delta at 60Hz is NOT a dropped frame", () => {
    expect(isFrameDropped(10, 60)).toBe(false);
  });

  it("33ms delta at 60Hz IS a dropped frame (spec P0: 2x budget)", () => {
    expect(isFrameDropped(33, 60)).toBe(true);
  });

  /**
   * At 120Hz: budget = 8.33ms. Drop threshold = 8.33 * 1.5 = 12.5ms.
   * 10ms delta → IS dropped at 120Hz but not at 60Hz.
   */
  /**
   * At 120Hz: budget = 8.33ms. Drop threshold = 8.33 * 1.5 = 12.5ms.
   * 10ms < 12.5ms → NOT dropped.
   * 14ms > 12.5ms → IS dropped at 120Hz but NOT at 60Hz (25ms threshold).
   */
  it("14ms delta: NOT dropped at 60Hz (threshold 25ms), IS dropped at 120Hz (threshold 12.5ms)", () => {
    expect(isFrameDropped(14, 60)).toBe(false);
    expect(isFrameDropped(14, 120)).toBe(true);
  });

  /**
   * budgetRatio: 33ms / 16.67ms = 1.98 at 60Hz
   */
  it("budgetRatio(33, 60) is approximately 1.98", () => {
    expect(budgetRatio(33, 60)).toBeCloseTo(33 / (1000 / 60), 3);
  });

  /**
   * budgetRatio(8.33, 120) = 8.33 / 8.33 = 1.0 (exactly on budget)
   */
  it("budgetRatio(8.33ms, 120Hz) is approximately 1.0", () => {
    expect(budgetRatio(1000 / 120, 120)).toBeCloseTo(1.0, 2);
  });

  it("rolling fps computation: 10 frames at 16.67ms = 60fps", () => {
    let state = makeFpsState();
    for (let i = 0; i < 10; i++) {
      state = recordFrame(state, i * 16.67, 60);
    }
    // 9 intervals of 16.67ms each, so fps = 9/((9*16.67)/1000) = ~60
    expect(state.fps).toBeGreaterThan(58);
    expect(state.fps).toBeLessThan(62);
  });

  it("rolling fps at 120Hz cadence is ~120", () => {
    let state = makeFpsState();
    for (let i = 0; i < 20; i++) {
      state = recordFrame(state, i * 8.33, 120);
    }
    expect(state.fps).toBeGreaterThan(115);
    expect(state.fps).toBeLessThan(125);
  });

  it("droppedFrames increments exactly once per genuine drop", () => {
    let state = makeFpsState();
    state = recordFrame(state, 0, 60);
    state = recordFrame(state, 16.67, 60); // normal — no drop
    state = recordFrame(state, 50, 60);    // 33.33ms gap — drop
    state = recordFrame(state, 66.67, 60); // 16.67ms — normal
    expect(state.droppedFrames).toBe(1);
  });

  it("window size clamps at 30 timestamps", () => {
    let state = makeFpsState();
    for (let i = 0; i < 50; i++) {
      state = recordFrame(state, i * 16.67, 60);
    }
    expect(state.timestamps.length).toBeLessThanOrEqual(30);
  });
});
