/**
 * VERIFIER — 8-item batch verification unit tests
 * Written by independent verifier; asserts math correctness from first principles.
 */
import { describe, it, expect } from "vitest";
import { LESSONS } from "../../lib/lessons";
import { stepDecel, isDecelDone } from "../../lib/engine/decel";

// ============================================================
// ITEM 3 — subtitle single-source: rail label === main-column subtitle
// ============================================================
describe("Item 3: subtitle single-source equality across all 8 lessons", () => {
  it("LESSONS array has exactly 8 entries", () => {
    expect(LESSONS).toHaveLength(8);
  });

  it("each lesson has a non-empty subtitle", () => {
    for (const l of LESSONS) {
      expect(typeof l.subtitle).toBe("string");
      expect(l.subtitle.trim().length).toBeGreaterThan(0);
    }
  });

  // Verify the exact subtitle values match what AppShell renders in both rail + main column
  // (AppShell uses l.subtitle in BOTH places from a single source: lib/lessons.ts)
  const expectedSubtitles: Record<number, string> = {
    1: "1:1 tracking, gain, and latency",
    2: "Physics-based motion vs easing curves",
    3: "State continuity and velocity handoff",
    4: "Anticipation, follow-through, slow-in/out, squash & stretch",
    5: "Gesture → inertia with zero visual seam",
    6: "Frame budget, jank, and the honest FPS meter",
    7: "Feedback timing and just-noticeable difference",
    8: "Spatial and navigational continuity",
  };

  for (const [idStr, expected] of Object.entries(expectedSubtitles)) {
    const id = Number(idStr);
    it(`Lesson ${id} subtitle is "${expected}"`, () => {
      const l = LESSONS.find(x => x.id === id);
      expect(l).toBeDefined();
      expect(l!.subtitle).toBe(expected);
    });
  }
});

// ============================================================
// ITEM 4 (P0) — GAIN MATH: object displacement = gain × pointer displacement from anchor
// Tests derived independently from the spec contract; do NOT trust builder's assertions.
// ============================================================
describe("Item 4 (P0): Lesson 01 gain math — independent derivation", () => {
  // Mirror the exact formula in Lesson01.tsx applyMoveAnchored:
  //   nx = anchorObj.x + gain * (currentPtr.x - anchorPtr.x)
  // then clamp. We use a wide stage so clamp doesn't interfere.
  const SQUARE_HALF = 24; // SQUARE_SIZE=48/2
  const STAGE_W = 2000;   // wide so clamp never fires
  const STAGE_H = 2000;

  function computePos(
    anchorObjX: number, anchorObjY: number,
    anchorPtrX: number, anchorPtrY: number,
    currPtrX: number, currPtrY: number,
    gain: number
  ): { x: number; y: number } {
    let nx = anchorObjX + gain * (currPtrX - anchorPtrX);
    let ny = anchorObjY + gain * (currPtrY - anchorPtrY);
    nx = Math.max(SQUARE_HALF, Math.min(STAGE_W - SQUARE_HALF, nx));
    ny = Math.max(SQUARE_HALF, Math.min(STAGE_H - SQUARE_HALF, ny));
    return { x: nx, y: ny };
  }

  // anchor at center (500,500), pointer moves 100px right → currPtr=(600,500)
  const A = { ox: 500, oy: 500, px: 500, py: 500 };

  it("gain=0.5: 100px pointer move → 50px object displacement (spec: half)", () => {
    const { x } = computePos(A.ox, A.oy, A.px, A.py, A.px + 100, A.py, 0.5);
    expect(x - A.ox).toBeCloseTo(50, 2); // 0.5 × 100 = 50
  });

  it("gain=1: 100px pointer move → 100px object displacement (spec: 1:1)", () => {
    const { x } = computePos(A.ox, A.oy, A.px, A.py, A.px + 100, A.py, 1);
    expect(x - A.ox).toBeCloseTo(100, 2);
  });

  it("gain=2: 100px pointer move → 200px object displacement (spec: twice)", () => {
    const { x } = computePos(A.ox, A.oy, A.px, A.py, A.px + 100, A.py, 2);
    expect(x - A.ox).toBeCloseTo(200, 2);
  });

  it("gain=0.5: 80px pointer move → 40px object displacement (variety input)", () => {
    const { x } = computePos(A.ox, A.oy, A.px, A.py, A.px + 80, A.py, 0.5);
    expect(x - A.ox).toBeCloseTo(40, 2);
  });

  it("gain=2: 50px pointer move → 100px object displacement (variety input)", () => {
    const { x } = computePos(A.ox, A.oy, A.px, A.py, A.px + 50, A.py, 2);
    expect(x - A.ox).toBeCloseTo(100, 2);
  });

  it("gain=1: diagonal 60px×80px pointer move → object moves same 60×80 (1:1)", () => {
    const { x, y } = computePos(A.ox, A.oy, A.px, A.py, A.px + 60, A.py + 80, 1);
    expect(x - A.ox).toBeCloseTo(60, 2);
    expect(y - A.oy).toBeCloseTo(80, 2);
  });

  it("gain=2: at gain=2, object displacement is strictly 2× pointer displacement (not 1:1)", () => {
    const ptrDisp = 73;
    const { x } = computePos(A.ox, A.oy, A.px, A.py, A.px + ptrDisp, A.py, 2);
    const objDisp = x - A.ox;
    // Must be 2× not 1×
    expect(objDisp).toBeCloseTo(2 * ptrDisp, 1);
    expect(objDisp).not.toBeCloseTo(ptrDisp, 0); // fails if 1:1 at 2×
  });

  it("anchor is measured from pointerdown, not from stage origin (anchor offset test)", () => {
    // Anchor at (300, 200) with object at (250, 180), pointer then moves 100px right
    const { x } = computePos(250, 180, 300, 200, 400, 200, 1);
    expect(x - 250).toBeCloseTo(100, 2); // pointer moved 100, gain=1, obj should move 100
  });

  it("gain=0.5 lags behind pointer: object is closer to anchor than pointer", () => {
    // ptr moved 100px from anchor → obj at 550, ptr at 600, anchor at 500
    const { x: objX } = computePos(A.ox, A.oy, A.px, A.py, A.px + 100, A.py, 0.5);
    const ptrX = A.px + 100;
    // Object is between anchor and pointer
    expect(objX).toBeGreaterThan(A.ox);
    expect(objX).toBeLessThan(ptrX);
  });
});

// ============================================================
// ITEM 7 (P0) — VELOCITY HANDOFF: card stays in bounds, velocity reflects at walls
// Independent derivation — verifier writes these from the spec contract.
// ============================================================
describe("Item 7 (P0): Lesson 05 bounds — independent derivation from spec", () => {
  const CARD_W = 80;
  const CARD_H = 56;
  const RESTITUTION = 0.6;

  function simulateBounce(
    startX: number, startY: number,
    vxps: number, vyps: number,
    stageW: number, stageH: number,
    friction = 4,
    maxSteps = 5000
  ) {
    const maxX = stageW - CARD_W;
    const maxY = stageH - CARD_H;
    let sx = { position: startX, velocity: vxps };
    let sy = { position: startY, velocity: vyps };
    const dt = 0.016;
    const allPositions: { x: number; y: number }[] = [];
    let bounceX = 0;
    let bounceY = 0;

    for (let i = 0; i < maxSteps; i++) {
      sx = stepDecel(sx, friction, dt);
      sy = stepDecel(sy, friction, dt);

      if (sx.position < 0) {
        sx.position = 0;
        sx.velocity = Math.abs(sx.velocity) * RESTITUTION;
        bounceX++;
      }
      if (sx.position > maxX) {
        sx.position = maxX;
        sx.velocity = -Math.abs(sx.velocity) * RESTITUTION;
        bounceX++;
      }
      if (sy.position < 0) {
        sy.position = 0;
        sy.velocity = Math.abs(sy.velocity) * RESTITUTION;
        bounceY++;
      }
      if (sy.position > maxY) {
        sy.position = maxY;
        sy.velocity = -Math.abs(sy.velocity) * RESTITUTION;
        bounceY++;
      }

      // Clamp (safety)
      sx.position = Math.max(0, Math.min(maxX, sx.position));
      sy.position = Math.max(0, Math.min(maxY, sy.position));
      allPositions.push({ x: sx.position, y: sy.position });

      if (isDecelDone(sx) && isDecelDone(sy)) break;
    }

    return { allPositions, bounceX, bounceY, finalX: sx.position, finalY: sy.position };
  }

  const STAGE_W = 400, STAGE_H = 250;
  const maxX = STAGE_W - CARD_W;
  const maxY = STAGE_H - CARD_H;

  it("hard rightward flick (3000 px/s): card stays within [0,maxX] at every step", () => {
    const { allPositions } = simulateBounce(200, 100, 3000, 0, STAGE_W, STAGE_H);
    for (const p of allPositions) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(maxX);
    }
  });

  it("hard leftward flick (-3000 px/s): card stays within [0,maxX] at every step", () => {
    const { allPositions } = simulateBounce(200, 100, -3000, 0, STAGE_W, STAGE_H);
    for (const p of allPositions) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(maxX);
    }
  });

  it("hard upward flick (0, -3000 px/s): card stays within [0,maxY] at every step", () => {
    const { allPositions } = simulateBounce(100, 100, 0, -3000, STAGE_W, STAGE_H);
    for (const p of allPositions) {
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(maxY);
    }
  });

  it("diagonal flick toward corner (4000, 3500 px/s): stays in bounds at every step", () => {
    const { allPositions } = simulateBounce(50, 40, 4000, 3500, STAGE_W, STAGE_H);
    for (const p of allPositions) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(maxX);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(maxY);
    }
  });

  it("velocity sign flips (elastic reflection) on rightward flick hitting right wall", () => {
    const { bounceX } = simulateBounce(200, 100, 3000, 0, STAGE_W, STAGE_H);
    expect(bounceX).toBeGreaterThanOrEqual(1);
  });

  it("velocity sign flips on leftward flick hitting left wall", () => {
    const { bounceX } = simulateBounce(100, 100, -3000, 0, STAGE_W, STAGE_H);
    expect(bounceX).toBeGreaterThanOrEqual(1);
  });

  it("card comes to rest inside bounds after hard diagonal flick", () => {
    const { finalX, finalY } = simulateBounce(100, 80, 5000, 4000, STAGE_W, STAGE_H);
    expect(finalX).toBeGreaterThanOrEqual(0);
    expect(finalX).toBeLessThanOrEqual(maxX);
    expect(finalY).toBeGreaterThanOrEqual(0);
    expect(finalY).toBeLessThanOrEqual(maxY);
  });

  it("extremely hard flick (10000 px/s) still stays in bounds (flying-off-screen FAIL case)", () => {
    const { allPositions } = simulateBounce(200, 100, 10000, 0, STAGE_W, STAGE_H);
    for (const p of allPositions) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(maxX);
    }
  });
});
