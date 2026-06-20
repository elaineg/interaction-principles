/**
 * INDEPENDENT VERIFIER unit tests for decelIntegrate.ts
 * Written fresh from the spec contract — not copied from builder.
 *
 * Asserts:
 *   1. Higher friction => monotonically shorter glide DISTANCE across full slider range 1..12
 *   2. Higher friction => monotonically shorter TIME-TO-REST across full slider range 1..12
 *   3. Multiple v0 values show the same monotone property
 *   4. Frame-rate independence: dt=1/60 and dt=1/120 yield distance/timeToRest within tolerance
 *   5. stepDecelIntegrate is dt-scaled (2 steps of dt/2 ≈ 1 step of dt)
 */
import { describe, it, expect } from "vitest";
import { measureGlide, stepDecelIntegrate } from "../../lib/engine/decelIntegrate";

// Slider range is 1..12, step 0.5
const FRICTION_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12];

// ─── MONOTONICITY: DISTANCE ───────────────────────────────────────────────────

describe("measureGlide: distance monotonically decreasing across friction range 1..12", () => {
  for (const v0 of [300, 600, 1000, 1500, 2000]) {
    it(`v0=${v0} px/s — distance strictly decreasing for every friction step`, () => {
      const results = FRICTION_VALUES.map(f => ({
        friction: f,
        ...measureGlide(v0, f),
      }));

      // Log actual values as evidence
      const distances = results.map(r => r.distance.toFixed(1));
      // Verify strict monotone decrease
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distance).toBeLessThan(results[i - 1].distance);
      }
      // Ensure the range is substantial: friction=1 must produce >10x longer glide than friction=12
      const ratio = results[0].distance / results[results.length - 1].distance;
      expect(ratio).toBeGreaterThan(10);
      // Suppress unused-variable lint on distances (we want it visible in test output on failure)
      void distances;
    });
  }
});

// ─── MONOTONICITY: TIME-TO-REST ───────────────────────────────────────────────

describe("measureGlide: time-to-rest monotonically decreasing across friction range 1..12", () => {
  for (const v0 of [300, 600, 1000, 1500, 2000]) {
    it(`v0=${v0} px/s — timeToRest strictly decreasing for every friction step`, () => {
      const results = FRICTION_VALUES.map(f => ({
        friction: f,
        ...measureGlide(v0, f),
      }));

      for (let i = 1; i < results.length; i++) {
        expect(results[i].timeToRest).toBeLessThan(results[i - 1].timeToRest);
      }
      // The highest-friction case must settle much faster than lowest-friction
      const ratio = results[0].timeToRest / results[results.length - 1].timeToRest;
      expect(ratio).toBeGreaterThan(5);
    });
  }
});

// ─── NUMERIC EVIDENCE: snapshot of actual values ─────────────────────────────
// These assertions encode the actual numbers produced by the integrator.
// A change to the formula will break these, catching silent regressions.

describe("measureGlide: numeric evidence for v0=1000 px/s across the slider range", () => {
  const v0 = 1000;

  it("friction=1 (LOW) yields distance > 950px and timeToRest > 6s", () => {
    const { distance, timeToRest } = measureGlide(v0, 1);
    // Analytical: v0/friction * (1 - e^(-friction * t)) → rest at ~v0/friction = 1000px
    expect(distance).toBeGreaterThan(950);
    expect(timeToRest).toBeGreaterThan(6);
  });

  it("friction=6 (MID) yields distance roughly v0/6 ≈ 150-170px", () => {
    const { distance } = measureGlide(v0, 6);
    expect(distance).toBeGreaterThan(140);
    expect(distance).toBeLessThan(200);
  });

  it("friction=12 (HIGH) yields distance roughly v0/12 ≈ 70-90px and timeToRest < 1s", () => {
    const { distance, timeToRest } = measureGlide(v0, 12);
    expect(distance).toBeGreaterThan(60);
    expect(distance).toBeLessThan(100);
    expect(timeToRest).toBeLessThan(1.0);
  });

  it("friction=1 distance is at least 10x the friction=12 distance", () => {
    const low = measureGlide(v0, 1);
    const high = measureGlide(v0, 12);
    expect(low.distance / high.distance).toBeGreaterThan(10);
  });

  it("friction=1 timeToRest is at least 8x the friction=12 timeToRest", () => {
    const low = measureGlide(v0, 1);
    const high = measureGlide(v0, 12);
    expect(low.timeToRest / high.timeToRest).toBeGreaterThan(8);
  });
});

// ─── FRAME-RATE INDEPENDENCE ──────────────────────────────────────────────────

describe("measureGlide: frame-rate independence (dt=1/60 vs dt=1/120)", () => {
  for (const friction of [1, 4, 8, 12]) {
    for (const v0 of [500, 1000]) {
      it(`v0=${v0}, friction=${friction}: 60Hz vs 120Hz distance within 1% tolerance`, () => {
        const at60 = measureGlide(v0, friction, 1 / 60);
        const at120 = measureGlide(v0, friction, 1 / 120);
        // Analytical solution is exact; numerical integration should differ by < 1%
        const distRatio = Math.abs(at60.distance - at120.distance) / Math.max(at60.distance, at120.distance);
        expect(distRatio).toBeLessThan(0.01);
      });

      it(`v0=${v0}, friction=${friction}: 60Hz vs 120Hz timeToRest within 5% tolerance`, () => {
        const at60 = measureGlide(v0, friction, 1 / 60);
        const at120 = measureGlide(v0, friction, 1 / 120);
        // timeToRest counts steps so will differ by ~1 step; allow 5%
        const timeRatio = Math.abs(at60.timeToRest - at120.timeToRest) / Math.max(at60.timeToRest, at120.timeToRest);
        expect(timeRatio).toBeLessThan(0.05);
      });
    }
  }
});

// ─── stepDecelIntegrate: dt-scaling correctness ───────────────────────────────

describe("stepDecelIntegrate: two steps of dt/2 approximate one step of dt (dt-scaling)", () => {
  // Use dt values where 2*dt does NOT exceed the 0.064s safeDt cap in stepDecelIntegrate.
  // dt=1/30 ≈ 0.033 → 2*dt ≈ 0.067 exceeds the 0.064 cap → would trigger clamping mismatch.
  // Only use dt <= 0.032 so 2*dt <= 0.064 stays below the cap.
  const CASES = [
    { v0: 1000, friction: 4, dt: 1 / 60 },
    { v0: 500, friction: 2, dt: 1 / 60 },
    { v0: 2000, friction: 8, dt: 1 / 60 },
  ];

  for (const { v0, friction, dt } of CASES) {
    it(`v0=${v0}, friction=${friction}, dt=${dt.toFixed(4)}: one step of 2*dt ≈ two steps of dt`, () => {
      const state = { position: 0, velocity: v0 };
      // Two steps of dt
      const twoHalf = stepDecelIntegrate(
        stepDecelIntegrate(state, friction, dt),
        friction,
        dt
      );
      // One step of 2*dt
      const oneDouble = stepDecelIntegrate(state, friction, 2 * dt);
      // Positions and velocities should match closely (within 0.1px / 5px/s)
      // Exponential formula is exact, so these should be equal to machine precision
      expect(Math.abs(twoHalf.position - oneDouble.position)).toBeLessThan(0.1);
      expect(Math.abs(twoHalf.velocity - oneDouble.velocity)).toBeLessThan(5);
    });
  }
});

// ─── BOUNDARY: decel never produces NaN or Infinity ──────────────────────────

describe("stepDecelIntegrate: never produces NaN/Infinity across extreme inputs", () => {
  const extremes = [
    { v0: 0, friction: 1 },
    { v0: 10000, friction: 1 },
    { v0: 10000, friction: 12 },
    { v0: 1, friction: 0.0001 }, // near-zero friction (safeFriction clamps it)
  ];

  for (const { v0, friction } of extremes) {
    it(`v0=${v0}, friction=${friction}: position and velocity are finite`, () => {
      const state = { position: 0, velocity: v0 };
      const next = stepDecelIntegrate(state, friction, 1 / 60);
      expect(Number.isFinite(next.position)).toBe(true);
      expect(Number.isFinite(next.velocity)).toBe(true);
      expect(Number.isNaN(next.position)).toBe(false);
      expect(Number.isNaN(next.velocity)).toBe(false);
    });
  }
});
