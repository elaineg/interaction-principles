/**
 * Pure deceleration integrator — extracted for unit-testability without DOM/React.
 *
 * Models friction as exponential drag: v(t) = v0 * e^(-friction * t)
 * Position: x(t) = x0 + v0/friction * (1 - e^(-friction * t))
 *
 * friction is the coefficient:
 *   LOW  friction (e.g. 1) → long, far glide
 *   HIGH friction (e.g. 12) → short, quick stop
 *
 * Key property for the verifier:
 *   for a FIXED lift-off velocity, higher friction ⇒ shorter glide distance AND shorter time-to-rest
 *   (both monotonically across the slider range)
 */

export interface DecelStep {
  position: number;
  velocity: number;
}

/**
 * Step the deceleration model by `dt` seconds.
 * dt-scaled — frame-rate independent.
 */
export function stepDecelIntegrate(
  state: DecelStep,
  friction: number,
  dt: number
): DecelStep {
  const safeDt = Math.min(dt, 0.064); // cap large dt gaps (tab focus-switch etc.)
  const safeFriction = Math.max(friction, 0.1);
  const decay = Math.exp(-safeFriction * safeDt);
  const newVelocity = state.velocity * decay;
  const newPosition = state.position + (state.velocity / safeFriction) * (1 - decay);
  return { position: newPosition, velocity: newVelocity };
}

/**
 * Run the decel loop to rest for a given (v0, friction).
 * Returns { distance: total glide distance, timeToRest: seconds until |v| < threshold }
 * Used by verifier to assert monotonicity of friction slider.
 *
 * @param v0      initial velocity (px/s)
 * @param friction coefficient
 * @param dt      frame step in seconds (default 1/60)
 * @param threshold velocity threshold below which we call "at rest" (default 0.5 px/s)
 */
export function measureGlide(
  v0: number,
  friction: number,
  dt = 1 / 60,
  threshold = 0.5
): { distance: number; timeToRest: number; steps: number } {
  let state: DecelStep = { position: 0, velocity: v0 };
  let steps = 0;
  const MAX_STEPS = 100_000;
  while (Math.abs(state.velocity) >= threshold && steps < MAX_STEPS) {
    state = stepDecelIntegrate(state, friction, dt);
    steps++;
  }
  return {
    distance: Math.abs(state.position),
    timeToRest: steps * dt,
    steps,
  };
}
