import { describe, it, expect } from "vitest";
import { stepSpring, makeSpringState, isAtRest } from "../../lib/engine/spring";
import { addSample, estimateVelocity, velocityMagnitude } from "../../lib/engine/velocity";
import { stepDecel, restPosition, rubberBand, isDecelDone } from "../../lib/engine/decel";
import { recordFrame, budgetRatio, isFrameDropped, makeFpsState } from "../../lib/engine/fps";

// ============================================================
// P0: LESSON 01 GAIN MATH — anchor-relative object displacement
// ============================================================

describe("Lesson 01 gain math (anchor-relative)", () => {
  // Helper that mimics the fixed applyMoveAnchored logic:
  // objectPos = anchorObj + gain × (currentPointer − anchorPtr), then clamp
  function computeObjectPos(
    anchorObjX: number,
    anchorPtrX: number,
    currentPtrX: number,
    gain: number,
    stageW = 1000,
    squareHalf = 24
  ): number {
    const dxPtr = currentPtrX - anchorPtrX;
    let nx = anchorObjX + gain * dxPtr;
    // clamp
    nx = Math.max(squareHalf, Math.min(stageW - squareHalf, nx));
    return nx;
  }

  it("gain 0.5× → object moves half the pointer distance", () => {
    // anchorObj=(100,100), anchorPtr=(100,100), pointer→(200,100)
    // Expected: 100 + 0.5 × (200-100) = 150
    expect(computeObjectPos(100, 100, 200, 0.5)).toBeCloseTo(150, 1);
  });

  it("gain 1× → object moves exactly the pointer distance (1:1)", () => {
    // Expected: 100 + 1 × (200-100) = 200
    expect(computeObjectPos(100, 100, 200, 1)).toBeCloseTo(200, 1);
  });

  it("gain 2× → object moves twice the pointer distance", () => {
    // Expected: 100 + 2 × (200-100) = 300 (pre-clamp; with large stageW=1000 stays at 300)
    expect(computeObjectPos(100, 100, 200, 2)).toBeCloseTo(300, 1);
  });

  it("at gain 1×, object displacement equals pointer displacement", () => {
    const anchorObjX = 80;
    const anchorPtrX = 95;
    const currentPtrX = 175;
    const ptrDisp = currentPtrX - anchorPtrX; // 80
    const objPos = computeObjectPos(anchorObjX, anchorPtrX, currentPtrX, 1);
    expect(objPos - anchorObjX).toBeCloseTo(ptrDisp, 1);
  });

  it("at gain 0.5×, delta (pointer−object) grows relative to gain=1", () => {
    const anchorObjX = 100, anchorPtrX = 100, currentPtrX = 200;
    const pos05 = computeObjectPos(anchorObjX, anchorPtrX, currentPtrX, 0.5);
    const pos1  = computeObjectPos(anchorObjX, anchorPtrX, currentPtrX, 1);
    // At gain=1, delta≈0. At gain=0.5, object lags behind pointer → delta grows
    expect(Math.abs(currentPtrX - pos05)).toBeGreaterThan(Math.abs(currentPtrX - pos1));
  });
});

// ============================================================
// P0: LESSON 05 VELOCITY BOUNDS — card stays inside stage on hard flick
// ============================================================

describe("Lesson 05 bounds (elastic reflection, P0)", () => {
  const RESTITUTION = 0.6;
  const CARD_W = 80;
  const CARD_H = 56;

  // Simulate the decel loop with elastic reflection, same logic as Lesson05.tsx
  function runDecelWithBounds(
    startX: number,
    startY: number,
    vxps: number,
    vyps: number,
    stageW: number,
    stageH: number,
    friction = 4,
    maxSteps = 3000
  ) {
    const maxX = stageW - CARD_W;
    const maxY = stageH - CARD_H;
    let stateX = { position: startX, velocity: vxps };
    let stateY = { position: startY, velocity: vyps };
    const dt = 0.016;
    const positions: { x: number; y: number }[] = [];
    let bounceCountX = 0;
    let bounceCountY = 0;

    for (let i = 0; i < maxSteps; i++) {
      stateX = stepDecel(stateX, friction, dt);
      stateY = stepDecel(stateY, friction, dt);

      let nx = stateX.position;
      let ny = stateY.position;

      if (nx < 0) {
        nx = 0;
        stateX.velocity = Math.abs(stateX.velocity) * RESTITUTION;
        bounceCountX++;
      }
      if (nx > maxX) {
        nx = maxX;
        stateX.velocity = -Math.abs(stateX.velocity) * RESTITUTION;
        bounceCountX++;
      }
      if (ny < 0) {
        ny = 0;
        stateY.velocity = Math.abs(stateY.velocity) * RESTITUTION;
        bounceCountY++;
      }
      if (ny > maxY) {
        ny = maxY;
        stateY.velocity = -Math.abs(stateY.velocity) * RESTITUTION;
        bounceCountY++;
      }

      nx = Math.max(0, Math.min(maxX, nx));
      ny = Math.max(0, Math.min(maxY, ny));

      stateX.position = nx;
      stateY.position = ny;

      positions.push({ x: nx, y: ny });

      if (isDecelDone(stateX) && isDecelDone(stateY)) break;
    }

    return { positions, bounceCountX, bounceCountY, finalX: stateX.position, finalY: stateY.position };
  }

  it("card stays within stage bounds at every step on a hard rightward flick", () => {
    const stageW = 400, stageH = 200;
    const maxX = stageW - CARD_W, maxY = stageH - CARD_H;
    const { positions } = runDecelWithBounds(200, 72, 3000, 0, stageW, stageH);
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(maxX);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(maxY);
    }
  });

  it("card stays within bounds on a hard diagonal flick toward corner", () => {
    const stageW = 400, stageH = 200;
    const maxX = stageW - CARD_W, maxY = stageH - CARD_H;
    const { positions } = runDecelWithBounds(40, 30, 4000, 3000, stageW, stageH);
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(maxX);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(maxY);
    }
  });

  it("velocity sign flips at least once on a hard flick toward a wall", () => {
    const { bounceCountX } = runDecelWithBounds(200, 72, 5000, 0, 400, 200);
    expect(bounceCountX).toBeGreaterThanOrEqual(1);
  });

  it("card comes to rest inside the stage (not at or past a boundary)", () => {
    const stageW = 400, stageH = 200;
    const maxX = stageW - CARD_W, maxY = stageH - CARD_H;
    const { finalX, finalY } = runDecelWithBounds(200, 72, 2000, 1500, stageW, stageH);
    expect(finalX).toBeGreaterThanOrEqual(0);
    expect(finalX).toBeLessThanOrEqual(maxX);
    expect(finalY).toBeGreaterThanOrEqual(0);
    expect(finalY).toBeLessThanOrEqual(maxY);
  });
});

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
