import { describe, expect, it } from 'vitest'
import type { ModuleSetupContext } from '@openpen/module-api'
import mod from '../src/index'

/**
 * The host delivers one plugin shortcut press to exactly one window, so the
 * handler runs once per press. The toggle therefore carries no time-window
 * de-duplication: every call it receives is a real press.
 */
function makeWindow() {
  let settings = { enabled: false }
  const ctx = {
    getSettings: () => settings,
    updateSettings: async (patch: Partial<typeof settings>) => {
      settings = { ...settings, ...patch }
    },
    onSettingsChange: () => () => {},
    onDispose: () => {},
  } as unknown as ModuleSetupContext
  mod.setup!(ctx)
  const handler = mod.contributes!.shortcuts!.find((s) => s.id === 'toggle-spotlight')!.handler
  return { handler, enabled: () => settings.enabled }
}

describe('toggle shortcut (host delivers each press to one window)', () => {
  it('one delivered press flips the spotlight exactly once', () => {
    const w = makeWindow()
    w.handler()
    expect(w.enabled()).toBe(true)
  })

  it('back-to-back presses are never swallowed (no debounce window)', () => {
    const w = makeWindow()
    w.handler()
    w.handler()
    expect(w.enabled()).toBe(false)
    w.handler()
    expect(w.enabled()).toBe(true)
  })
})
