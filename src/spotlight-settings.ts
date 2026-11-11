/**
 * Allowed ranges and defaults for the spotlight's adjustable settings, plus the
 * clamps every reader applies. The settings schema is deliberately unbounded
 * (an out-of-range saved value would otherwise fail validation and discard the
 * whole settings object), so the range is enforced on read, here, in one place.
 */
export const RADIUS_MIN = 60
export const RADIUS_MAX = 400
export const RADIUS_DEFAULT = 150

export const DIM_MIN = 0.1
export const DIM_MAX = 0.95
export const DIM_DEFAULT = 0.8

/** Round to an integer and clamp into 60..400; non-finite input falls back to the default. */
export function clampRadius(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return RADIUS_DEFAULT
  return Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, Math.round(value)))
}

/** Clamp into 0.1..0.95 (rounded to 2 decimals); non-finite input falls back to the default. */
export function clampDimOpacity(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DIM_DEFAULT
  return Math.min(DIM_MAX, Math.max(DIM_MIN, Math.round(value * 100) / 100))
}
