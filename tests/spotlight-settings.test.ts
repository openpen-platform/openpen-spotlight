import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
  clearModuleContext,
  setModuleContext,
  type ModuleSetupContext,
} from '@openpen/module-api'
import spotlightModule from '../src/index'
import SpotlightOverlay from '../src/SpotlightOverlay.vue'
import { MODULE_ID } from '../src/module-id'
import {
  DIM_DEFAULT,
  DIM_MAX,
  DIM_MIN,
  RADIUS_DEFAULT,
  RADIUS_MAX,
  RADIUS_MIN,
  clampDimOpacity,
  clampRadius,
} from '../src/spotlight-settings'

describe('clamps — AC#5 radius 60..400, dim level 0.1..0.95', () => {
  it('keeps in-range values, clamps out-of-range ones, falls back to the default for non-numbers', () => {
    expect([clampRadius(60), clampRadius(150), clampRadius(400)]).toEqual([RADIUS_MIN, 150, RADIUS_MAX])
    expect([clampRadius(5), clampRadius(999)]).toEqual([60, 400])
    expect(clampRadius(Number.NaN)).toBe(RADIUS_DEFAULT)
    expect([clampDimOpacity(0.1), clampDimOpacity(0.8), clampDimOpacity(0.95)]).toEqual([DIM_MIN, 0.8, DIM_MAX])
    expect([clampDimOpacity(0), clampDimOpacity(5)]).toEqual([0.1, 0.95])
    expect(clampDimOpacity(Number.NaN)).toBe(DIM_DEFAULT)
    // The schema must not reject the whole settings object over one bad value.
    expect(() => spotlightModule.settingsSchema!.parse({ radius: 999, dimOpacity: 5 })).not.toThrow()
  })
})

describe('overlay applies out-of-range saved values clamped — AC#5', () => {
  afterEach(() => clearModuleContext(MODULE_ID))

  function mountWith(saved: Record<string, unknown>) {
    const ctx = {
      moduleId: MODULE_ID,
      locale: 'en',
      getSettings: () => ({ enabled: true, softEdge: false, ...saved }),
      onSettingsChange: () => () => {},
    } as unknown as ModuleSetupContext
    setModuleContext(MODULE_ID, ctx)
    return mount(SpotlightOverlay)
  }

  it('saved radius 999 / dim 5 draw as 400px / 0.95, and 5 / 0 as 60px / 0.1', async () => {
    const hi = mountWith({ radius: 999, dimOpacity: 5 })
    await nextTick()
    const hiStyle = hi.find('[data-testid="spotlight-overlay"]').attributes('style') ?? ''
    expect(hiStyle).toContain('400px')
    expect(hiStyle).not.toContain('999px')
    expect(hiStyle).toContain('rgba(0, 0, 0, 0.95)')
    hi.unmount()

    const lo = mountWith({ radius: 5, dimOpacity: 0 })
    await nextTick()
    const loStyle = lo.find('[data-testid="spotlight-overlay"]').attributes('style') ?? ''
    expect(loStyle).toContain('60px')
    expect(loStyle).toContain('rgba(0, 0, 0, 0.1)')
    lo.unmount()
  })
})
