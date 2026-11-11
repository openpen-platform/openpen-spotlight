import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModuleSetupContext } from '@openpen/module-api'

/**
 * The host sends one `module:shortcut-triggered` to every window, and every
 * overlay window (one per display) runs the handler. So on a multi-display
 * machine one key press calls the toggle handler once per overlay window, each
 * in its own JS realm with its own module state. Each window is simulated here
 * as a fresh copy of the module wired to a shared settings store whose
 * propagation to the other windows is delayed until `flush()`.
 */
type Settings = { enabled: boolean }

async function makeWindows(count: number) {
  let store: Settings = { enabled: false }
  const pending: Array<Partial<Settings>> = []
  const windows: Array<{
    cache: Settings
    subs: Array<(s: Settings) => void>
    handler: () => void
  }> = []

  for (let i = 0; i < count; i++) {
    vi.resetModules()
    const mod = (await import('../src/index')).default
    const win = { cache: { ...store }, subs: [] as Array<(s: Settings) => void>, handler: () => {} }
    const ctx = {
      getSettings: () => win.cache,
      updateSettings: async (patch: Partial<Settings>) => {
        pending.push(patch)
      },
      onSettingsChange: (cb: (s: Settings) => void) => {
        win.subs.push(cb)
        return () => {}
      },
      onDispose: () => {},
    } as unknown as ModuleSetupContext
    mod.setup!(ctx)
    win.handler = mod.contributes!.shortcuts!.find((s) => s.id === 'toggle-spotlight')!.handler
    windows.push(win)
  }

  /** Persist the queued writes, then deliver the new settings to every window. */
  function flush() {
    while (pending.length) store = { ...store, ...pending.shift() }
    for (const w of windows) {
      w.cache = { ...store }
      for (const cb of w.subs) cb(w.cache)
    }
  }

  return { windows, flush, enabled: () => store.enabled }
}

describe('toggle shortcut with several overlay windows (one per display)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('one key press flips the spotlight once, whether the windows read stale or already-propagated state; a later press flips it back', async () => {
    const { windows, flush, enabled } = await makeWindows(3)

    // Every window runs its handler before any write has propagated.
    for (const w of windows) w.handler()
    flush()
    expect(enabled()).toBe(true)

    // A late window runs its handler after the first write has propagated.
    vi.advanceTimersByTime(1000)
    windows[0].handler()
    flush()
    expect(enabled()).toBe(false)
    windows[1].handler()
    windows[2].handler()
    flush()
    expect(enabled()).toBe(false)
  })
})
