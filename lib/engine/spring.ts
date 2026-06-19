/**
 * Spring integrator — semi-implicit Euler.
 * Pure function, no DOM/React deps. Unit-testable.
 *
 * Model: mass-spring-damper
 *   F = -stiffness * displacement - damping * velocity
 *   a = F / mass
 */

export interface SpringState {
  position: number;   // current position (px or any unit)
  velocity: number;   // current velocity (same unit / s)
}

export interface SpringParams {
  mass: number;       // kg-equivalent (1 is a good default)
  stiffness: number;  // spring constant (e.g. 180)
  damping: number;    // damping coefficient (e.g. 20)
}

/**
 * Step the spring by `dt` seconds toward `target`.
 * Uses semi-implicit Euler (velocity updated before position).
 */
export function stepSpring(
  state: SpringState,
  params: SpringParams,
  target: number,
  dt: number
): SpringState {
  const { position, velocity } = state;
  const { mass, stiffness, damping } = params;

  // Clamp dt to avoid instability on large gaps (e.g. tab hidden)
  const safeDt = Math.min(dt, 0.064);

  const displacement = position - target;
  const springForce = -stiffness * displacement;
  const dampingForce = -damping * velocity;
  const acceleration = (springForce + dampingForce) / mass;

  // Semi-implicit: update velocity first, then position
  const newVelocity = velocity + acceleration * safeDt;
  const newPosition = position + newVelocity * safeDt;

  return { position: newPosition, velocity: newVelocity };
}

/**
 * Returns true when the spring is at rest (below motion threshold).
 */
export function isAtRest(
  state: SpringState,
  target: number,
  threshold = 0.1
): boolean {
  return (
    Math.abs(state.position - target) < threshold &&
    Math.abs(state.velocity) < threshold
  );
}

/**
 * Create a default spring state at a given position.
 */
export function makeSpringState(position: number): SpringState {
  return { position, velocity: 0 };
}
