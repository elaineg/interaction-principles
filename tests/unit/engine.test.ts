import { describe, it, expect } from "vitest";
import { stepSpring, makeSpringState, isAtRest } from "../../lib/engine/spring";
import { addSample, estimateVelocity, velocityMagnitude } from "../../lib/engine/velocity";
import { stepDecel, restPosition, rubberBand, isDecelDone } from "../../lib/engine/decel";
import { recordFrame, budgetRatio, isFrameDropped, makeFpsState } from "../../lib/engine/fps";

// ============================================================
// SPRING ENGINE
// ============================================================

describe("stepSpring", () => {
  it("moves position toward target", () => {
    const state = makeSpringState(0);
    const params = { mass: 1, stiffness: 180, damping: 20 };
    const next = stepSpring(state, params, 100, 0.016);
    expect(next.position).toBeGreaterThan(0);
    expect(next.position).toBeLessThan(100);
  });

  it("gain positive velocity toward target", () => {
    const state = makeSpringState(0);
    const params = { mass: 1, stiffness: 180, damping: 20 };
    const next = stepSpring(state, params, 100, 0.016);
    expect(next.velocity).toBeGreaterThan(0);
  });

  it("converges to target over many steps", () => {
    let state = makeSpringState(0);
    const params = { mass: 1, stiffness: 180, damping: 25 };
    for (let i = 0; i < 500; i++) {
      state = stepSpring(state, params, 100, 0.016);
    }
    expect(state.position).toBeCloseTo(100, 0);
    expect(Math.abs(state.velocity)).toBeLessThan(1);
  });

  it("detects at rest", () => {
    const state = { position: 100.01, velocity: 0.05 };
    expect(isAtRest(state, 100)).toBe(true);
  });

  it("not at rest when far away", () => {
    const state = { position: 50, velocity: 10 };
    expect(isAtRest(state, 100)).toBe(false);
  });

  it("handles large dt without instability", () => {
    const state = makeSpringState(0);
    const params = { mass: 1, stiffness: 180, damping: 20 };
    // dt clamped to 0.064 so position should remain finite
    const next = stepSpring(state, params, 100, 10);
    expect(Number.isFinite(next.position)).toBe(true);
    expect(Number.isFinite(next.velocity)).toBe(true);
  });

  it("spring with high stiffness overshoots target", () => {
    // Underdamped spring should overshoot
    let state = makeSpringState(0);
    const params = { mass: 1, stiffness: 500, damping: 5 };
    const positions: number[] = [];
    for (let i = 0; i < 200; i++) {
      state = stepSpring(state, params, 100, 0.016);
      positions.push(state.position);
    }
    // At some point it should exceed 100 (overshoot)
    expect(positions.some(p => p > 100)).toBe(true);
  });
});

// ============================================================
// VELOCITY TRACKER
// ============================================================

describe("estimateVelocity", () => {
  it("returns zero for empty samples", () => {
    const result = estimateVelocity([]);
    expect(result.vx).toBe(0);
    expect(result.vy).toBe(0);
  });

  it("returns zero for single sample", () => {
    const result = estimateVelocity([{ x: 10, y: 20, t: 0 }]);
    expect(result.vx).toBe(0);
    expect(result.vy).toBe(0);
  });

  it("computes positive x velocity for rightward motion", () => {
    const samples = [
      { x: 0, y: 0, t: 0 },
      { x: 10, y: 0, t: 16 },
      { x: 20, y: 0, t: 32 },
    ];
    const { vx, vy } = estimateVelocity(samples);
    expect(vx).toBeGreaterThan(0); // moving right
    expect(Math.abs(vy)).toBeLessThan(0.1); // no vertical motion
  });

  it("computes negative velocity for leftward motion", () => {
    const samples = [
      { x: 30, y: 0, t: 0 },
      { x: 20, y: 0, t: 16 },
      { x: 10, y: 0, t: 32 },
    ];
    const { vx } = estimateVelocity(samples);
    expect(vx).toBeLessThan(0);
  });

  it("velocity magnitude is positive", () => {
    const samples = [
      { x: 0, y: 0, t: 0 },
      { x: 5, y: 5, t: 16 },
    ];
    expect(velocityMagnitude(samples)).toBeGreaterThan(0);
  });
});

describe("addSample", () => {
  it("adds a sample", () => {
    const result = addSample([], 10, 20, 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 10, y: 20, t: 100 });
  });

  it("trims old samples beyond 100ms", () => {
    const samples = [
      { x: 0, y: 0, t: 0 },   // 110ms old at t=110 — trimmed
      { x: 5, y: 0, t: 50 },  // 60ms old — kept
    ];
    const result = addSample(samples, 10, 0, 110);
    expect(result.some(s => s.t === 0)).toBe(false);
    expect(result.some(s => s.t === 50)).toBe(true);
  });
});

// ============================================================
// DECELERATION ENGINE
// ============================================================

describe("stepDecel", () => {
  it("decelerates velocity over time", () => {
    const state = { position: 0, velocity: 500 }; // 500 px/s
    const next = stepDecel(state, 5, 0.016);
    expect(next.velocity).toBeLessThan(500);
    expect(next.velocity).toBeGreaterThan(0);
  });

  it("moves position forward with positive velocity", () => {
    const state = { position: 0, velocity: 500 };
    const next = stepDecel(state, 5, 0.016);
    expect(next.position).toBeGreaterThan(0);
  });

  it("stops eventually (low velocity threshold)", () => {
    let state = { position: 0, velocity: 100 };
    for (let i = 0; i < 300; i++) {
      state = stepDecel(state, 5, 0.016);
    }
    expect(isDecelDone(state)).toBe(true);
  });

  it("rest position matches integral", () => {
    // v(t) = v0 * e^(-f*t), integral = v0/f
    const v0 = 200;
    const f = 5;
    const expected = restPosition(0, v0, f);
    expect(expected).toBeCloseTo(v0 / f, 0);
  });
});

describe("rubberBand", () => {
  it("returns position when within bounds", () => {
    expect(rubberBand(50, 0, 100)).toBe(50);
  });

  it("applies tension below min", () => {
    const result = rubberBand(-20, 0, 100, 0.4);
    expect(result).toBeGreaterThan(-20); // compressed
    expect(result).toBeLessThan(0);       // still negative
  });

  it("applies tension above max", () => {
    const result = rubberBand(120, 0, 100, 0.4);
    expect(result).toBeLessThan(120);
    expect(result).toBeGreaterThan(100);
  });
});

// ============================================================
// FPS METER
// ============================================================

describe("recordFrame", () => {
  it("computes fps from rolling window", () => {
    let state = makeFpsState();
    const now = 1000;
    // Simulate 60fps (16.67ms per frame)
    for (let i = 0; i < 30; i++) {
      state = recordFrame(state, now + i * 16.67, 60);
    }
    expect(state.fps).toBeGreaterThan(55);
    expect(state.fps).toBeLessThan(65);
  });

  it("drops fewer frames at normal cadence", () => {
    let state = makeFpsState();
    for (let i = 0; i < 30; i++) {
      state = recordFrame(state, i * 16.67, 60);
    }
    expect(state.droppedFrames).toBe(0);
  });

  it("counts dropped frames when delta exceeds 1.5x target", () => {
    let state = makeFpsState();
    // Normal frames first
    state = recordFrame(state, 0, 60);
    state = recordFrame(state, 16.67, 60);
    // Dropped frame: 50ms delta (> 16.67 * 1.5 = 25ms)
    state = recordFrame(state, 66.67, 60);
    expect(state.droppedFrames).toBeGreaterThan(0);
  });
});

describe("budgetRatio", () => {
  it("returns 1.0 for exactly on-budget frame at 60Hz", () => {
    expect(budgetRatio(1000 / 60, 60)).toBeCloseTo(1.0, 2);
  });

  it("returns >1 for over-budget frame", () => {
    expect(budgetRatio(30, 60)).toBeGreaterThan(1);
  });

  it("is smaller at 120Hz for same delta", () => {
    // 16.67ms at 120Hz target (8.33ms) should have ratio ~2
    expect(budgetRatio(16.67, 120)).toBeGreaterThan(1.5);
  });
});

describe("isFrameDropped", () => {
  it("not dropped for on-time frame", () => {
    expect(isFrameDropped(16.67, 60)).toBe(false);
  });

  it("dropped for 2x budget", () => {
    expect(isFrameDropped(34, 60)).toBe(true);
  });
});
