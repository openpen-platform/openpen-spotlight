import { describe, expect, it } from 'vitest'
import module, { MODULE_ID } from '../src/index'

describe('spotlight module contract', () => {
  it('declares the canonical scoped id', () => {
    expect(MODULE_ID).toBe('@openpen/spotlight')
    expect(module.id).toBe('@openpen/spotlight')
  })

  it('declares a version (required for plugins)', () => {
    expect(module.version).toBe('1.0.0')
  })

  it('contributes htmlOverlays, controlBar, and settingsPanels', () => {
    const c = module.contributes!
    expect(c.htmlOverlays?.map((o) => o.id)).toContain('spotlight')
    expect(c.controlBar?.map((b) => b.id)).toContain('spotlight')
    expect(c.settingsPanels?.map((p) => p.id)).toContain('spotlight-settings')
  })

  it('mounts a component on each contributed surface', () => {
    const c = module.contributes!
    expect(c.htmlOverlays?.[0]?.component).toBeTruthy()
    expect(c.controlBar?.[0]?.component).toBeTruthy()
    expect(c.settingsPanels?.[0]?.component).toBeTruthy()
  })
})

describe('settingsSchema', () => {
  it('parses an empty object into the documented defaults', () => {
    const parsed = module.settingsSchema!.parse({}) as Record<string, unknown>
    expect(parsed).toEqual({
      enabled: false,
      radius: 150,
      dimOpacity: 0.8,
      softEdge: true,
    })
  })

  it('rejects radius outside the 60..400 range', () => {
    expect(() => module.settingsSchema!.parse({ radius: 59 })).toThrow()
    expect(() => module.settingsSchema!.parse({ radius: 401 })).toThrow()
    expect(() => module.settingsSchema!.parse({ radius: 60 })).not.toThrow()
    expect(() => module.settingsSchema!.parse({ radius: 400 })).not.toThrow()
  })

  it('rejects dimOpacity outside the 0.1..0.95 range', () => {
    expect(() => module.settingsSchema!.parse({ dimOpacity: 0.05 })).toThrow()
    expect(() => module.settingsSchema!.parse({ dimOpacity: 0.96 })).toThrow()
    expect(() => module.settingsSchema!.parse({ dimOpacity: 0.1 })).not.toThrow()
    expect(() => module.settingsSchema!.parse({ dimOpacity: 0.95 })).not.toThrow()
  })

  it('defaults enabled to false (spec: off until the user turns it on)', () => {
    const parsed = module.settingsSchema!.parse({}) as { enabled: boolean }
    expect(parsed.enabled).toBe(false)
  })
})
