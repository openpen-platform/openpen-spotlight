import { describe, expect, it } from 'vitest'
import {
  backdropColor,
  featherWidth,
  innerStop,
  maskGradient,
  type SpotlightConfig,
} from '../src/spotlight-mask'

describe('featherWidth', () => {
  it('returns 0 when softEdge is false (hard edge)', () => {
    expect(featherWidth(150, false)).toBe(0)
    expect(featherWidth(60, false)).toBe(0)
    expect(featherWidth(400, false)).toBe(0)
  })

  it('floors the band at 24px when radius*0.4 is below the floor', () => {
    // radius 60 → proportional 24 → exactly at floor
    expect(featherWidth(60, true)).toBe(24)
    // radius 50 → proportional 20 → clamped up to 24, but capped at radius (50) → 24
    expect(featherWidth(50, true)).toBe(24)
  })

  it('uses radius*0.4 in the proportional range', () => {
    expect(featherWidth(150, true)).toBeCloseTo(60, 10) // 150*0.4
    expect(featherWidth(400, true)).toBeCloseTo(160, 10) // 400*0.4
    expect(featherWidth(100, true)).toBeCloseTo(40, 10)
  })

  it('never exceeds the radius for very small radii', () => {
    // radius 10 → proportional 4 → clamp floor 24 → but capped at radius 10
    expect(featherWidth(10, true)).toBe(10)
    // radius 20 → proportional 8 → floor 24 → capped at 20
    expect(featherWidth(20, true)).toBe(20)
    // radius 24 → proportional 9.6 → floor 24 → capped at 24
    expect(featherWidth(24, true)).toBe(24)
  })
})

describe('innerStop', () => {
  it('equals radius for a hard edge (no feather)', () => {
    expect(innerStop(150, false)).toBe(150)
    expect(innerStop(60, false)).toBe(60)
    expect(innerStop(400, false)).toBe(400)
  })

  it('is radius minus feather for a soft edge', () => {
    expect(innerStop(150, true)).toBeCloseTo(90, 10) // 150 - 60
    expect(innerStop(400, true)).toBeCloseTo(240, 10) // 400 - 160
    expect(innerStop(60, true)).toBe(36) // 60 - 24
  })

  it('clamps to 0 and never goes negative when feather equals radius', () => {
    // radius 10 → feather 10 → innerStop 0
    expect(innerStop(10, true)).toBe(0)
    expect(innerStop(20, true)).toBe(0)
  })
})

describe('maskGradient', () => {
  it('builds a soft-edge gradient with distinct inner/outer stops anchored at cursor vars', () => {
    const config: SpotlightConfig = { radius: 150, dimOpacity: 0.8, softEdge: true }
    const g = maskGradient(config)
    expect(g).toBe(
      'radial-gradient(circle at var(--x) var(--y), transparent 90px, rgba(0, 0, 0, 1) 150px)',
    )
  })

  it('builds a hard-edge gradient where the clear zone fills the whole radius', () => {
    const config: SpotlightConfig = { radius: 150, dimOpacity: 0.8, softEdge: false }
    const g = maskGradient(config)
    // hard edge: inner stop == outer stop == radius
    expect(g).toBe(
      'radial-gradient(circle at var(--x) var(--y), transparent 150px, rgba(0, 0, 0, 1) 150px)',
    )
  })

  it('anchors the gradient at the cursor CSS variables, not fixed coordinates', () => {
    const g = maskGradient({ radius: 200, dimOpacity: 0.5, softEdge: true })
    expect(g).toContain('circle at var(--x) var(--y)')
  })

  it('uses fully-opaque mask colour so dim level lives in the backdrop alpha', () => {
    const g = maskGradient({ radius: 200, dimOpacity: 0.5, softEdge: true })
    expect(g).toContain('rgba(0, 0, 0, 1)')
  })
})

describe('backdropColor', () => {
  it('renders the dim opacity into an rgba black fill', () => {
    expect(backdropColor(0.8)).toBe('rgba(0, 0, 0, 0.8)')
    expect(backdropColor(0.75)).toBe('rgba(0, 0, 0, 0.75)')
    expect(backdropColor(0.95)).toBe('rgba(0, 0, 0, 0.95)')
  })
})
