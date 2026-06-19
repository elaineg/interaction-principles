/**
 * Deceleration / friction model for flick-based momentum.
 * Pure function, no DOM/React deps. Unit-testable.
 *
 * Models friction as a proportional drag: v(t) = v0 * e^(-friction * t)
 * Position: x(t) = x0 + v0/friction * (1 - e^(-friction * t))
 * Settles to: x0 + v0/friction
 */

export interface DecelState {
  position: number;   // current position (px)
  velocity: number;   // current velocity (px/s)
}

/**
 * Step the deceleration model by `dt` seconds.
 *
 * @param state  current position + velocity
 * @param friction  deceleration coefficient (higher = stops sooner; ~5 is a good default)
 * @param dt  time step in seconds
 * @returns new state
 */
export function stepDecel(
  state: DecelState,
  friction: number,
  dt: number
): DecelState {
  const safeDt = Math.min(dt, 0.064);
  const safeFriction = Math.max(friction, 0.1);

  // Exponential velocity decay
  const decay = Math.exp(-safeFriction * safeDt);
  const newVelocity = state.velocity * decay;

  // Exact position from integral of velocity over dt
  const newPosition =
    state.position + (state.velocity / safeFriction) * (1 - decay);

  return { position: newPosition, velocity: newVelocity };
}

/**
 * Estimate where the object will come to rest given initial conditions.
 */
export function restPosition(
  startPos: number,
  startVelocity: number,
  friction: number
): number {
  return startPos + startVelocity / Math.max(friction, 0.1);
}

/**
 * Apply rubber-band clamping at bounds.
 * Returns the clamped position with a spring-like resistance beyond the bound.
 */
export function rubberBand(
  position: number,
  min: number,
  max: number,
  tension = 0.4
): number {
  if (position < min) {
    const overflow = min - position;
    return min - overflow * tension;
  }
  if (position > max) {
    const overflow = position - max;
    return max + overflow * tension;
  }
  return position;
}

/**
 * Returns true when the deceleration has effectively stopped.
 */
export function isDecelDone(state: DecelState, threshold = 0.5): boolean {
  return Math.abs(state.velocity) < threshold;
}
