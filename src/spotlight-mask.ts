/**
 * Pure geometry/style helpers for the spotlight overlay.
 *
 * All radius / dim / gradient-stop math lives here as side-effect-free
 * functions so the overlay component stays a thin reactive shell and the
 * numbers stay unit-testable without a DOM. The overlay never recomputes
 * these inline.
 */

/** Resolved spotlight settings (post-schema-default). */
export interface SpotlightConfig {
  /** Clear-circle radius in CSS pixels (transparent inner stop). */
  radius: number
  /** Backdrop dim opacity, 0..1. */
  dimOpacity: number
  /** When true, the mask fades over a feather band; when false it is a hard edge. */
  softEdge: boolean
}

/**
 * Feather band width in CSS pixels — the distance over which the mask ramps
 * from fully transparent (lit) to fully opaque (dimmed).
 *
 * Soft edge scales with radius so large spotlights keep a proportional
 * falloff; a hard edge collapses the band to zero. The proportional factor
 * and floor are tuned to read as "soft" across the 60..400 radius range
 * without ever exceeding the radius itself.
 */
export function featherWidth(radius: number, softEdge: boolean): number {
  if (!softEdge) return 0
  const proportional = radius * 0.4
  return Math.min(Math.max(proportional, 24), radius)
}

/**
 * Inner stop: the radius out to which the spotlight is fully clear
 * (transparent). With a soft edge the clear zone shrinks so the feather band
 * fits inside the requested radius; with a hard edge the clear zone fills the
 * whole radius.
 */
export function innerStop(radius: number, softEdge: boolean): number {
  return Math.max(radius - featherWidth(radius, softEdge), 0)
}

/**
 * Build the `radial-gradient(...)` value used for both the CSS `mask` and the
 * backdrop `background`. Anchored at the `var(--x)/var(--y)` cursor variables
 * (browser batches their updates), so the gradient string itself is static
 * per-config and only needs rebuilding when settings change.
 *
 * The dimmed band uses an opaque mask colour (`rgba(0,0,0,1)`); the actual dim
 * level comes from the element's own background alpha (`backdropColor`). This
 * keeps the mask a pure clear-vs-keep stencil.
 */
export function maskGradient(config: SpotlightConfig): string {
  const inner = innerStop(config.radius, config.softEdge)
  const outer = config.radius
  return (
    `radial-gradient(circle at var(--x) var(--y), ` +
    `transparent ${inner}px, ` +
    `rgba(0, 0, 0, 1) ${outer}px)`
  )
}

/** Backdrop fill colour carrying the dim opacity. */
export function backdropColor(dimOpacity: number): string {
  return `rgba(0, 0, 0, ${dimOpacity})`
}
