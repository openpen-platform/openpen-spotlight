import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
  setModuleContext,
  clearModuleContext,
  type ModuleSetupContext,
} from '@openpen/module-api'
import SpotlightOverlay from '../src/SpotlightOverlay.vue'
import { MODULE_ID } from '../src/module-id'

interface SpotlightSettings {
  enabled: boolean
  radius: number
  dimOpacity: number
  softEdge: boolean
}

/**
 * Minimal fake of the host-provided ModuleSetupContext. Only the surface the
 * overlay actually uses is implemented: getSettings + onSettingsChange. The
 * fake lets the test drive settings changes the same way the host would after
 * updateSettings().
 */
function makeFakeContext(initial: SpotlightSettings) {
  let current = initial
  const subscribers = new Set<(s: SpotlightSettings) => void>()

  const ctx: Partial<ModuleSetupContext> = {
    moduleId: MODULE_ID,
    locale: 'en',
    getSettings: (() => current) as ModuleSetupContext['getSettings'],
    onSettingsChange: ((cb: (s: SpotlightSettings) => void) => {
      subscribers.add(cb)
      return () => subscribers.delete(cb)
    }) as ModuleSetupContext['onSettingsChange'],
  }

  function emit(next: SpotlightSettings) {
    current = next
    for (const cb of subscribers) cb(next)
  }

  return { ctx: ctx as ModuleSetupContext, emit, subscriberCount: () => subscribers.size }
}

const baseSettings: SpotlightSettings = {
  enabled: false,
  radius: 150,
  dimOpacity: 0.8,
  softEdge: true,
}

function moveListenerCalls(spy: ReturnType<typeof vi.spyOn>): number {
  return spy.mock.calls.filter((c) => c[0] === 'mousemove').length
}

describe('SpotlightOverlay listener lifecycle', () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener')
    removeSpy = vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    addSpy.mockRestore()
    removeSpy.mockRestore()
    clearModuleContext(MODULE_ID)
  })

  it('does not render and attaches no mousemove listener when enabled=false', async () => {
    const { ctx } = makeFakeContext({ ...baseSettings, enabled: false })
    setModuleContext(MODULE_ID, ctx)

    const wrapper = mount(SpotlightOverlay)
    await nextTick()

    expect(wrapper.find('[data-testid="spotlight-overlay"]').exists()).toBe(false)
    expect(moveListenerCalls(addSpy)).toBe(0)

    wrapper.unmount()
  })

  it('renders and attaches exactly one mousemove listener when enabled=true', async () => {
    const { ctx } = makeFakeContext({ ...baseSettings, enabled: true })
    setModuleContext(MODULE_ID, ctx)

    const wrapper = mount(SpotlightOverlay)
    await nextTick()

    expect(wrapper.find('[data-testid="spotlight-overlay"]').exists()).toBe(true)
    expect(moveListenerCalls(addSpy)).toBe(1)

    wrapper.unmount()
  })

  it('removes the same onMove listener when toggled enabled true -> false', async () => {
    const { ctx, emit } = makeFakeContext({ ...baseSettings, enabled: true })
    setModuleContext(MODULE_ID, ctx)

    const wrapper = mount(SpotlightOverlay)
    await nextTick()
    expect(moveListenerCalls(addSpy)).toBe(1)
    const attachedHandler = addSpy.mock.calls.find((c) => c[0] === 'mousemove')![1]

    emit({ ...baseSettings, enabled: false })
    await nextTick()

    const removeCalls = removeSpy.mock.calls.filter((c) => c[0] === 'mousemove')
    expect(removeCalls.length).toBe(1)
    // detach MUST target the identical handler reference that was attached,
    // otherwise removeEventListener is a no-op and the listener leaks.
    expect(removeCalls[0][1]).toBe(attachedHandler)
    expect(wrapper.find('[data-testid="spotlight-overlay"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('does not double-register when enabled=true is emitted repeatedly (idempotent guard)', async () => {
    const { ctx, emit } = makeFakeContext({ ...baseSettings, enabled: true })
    setModuleContext(MODULE_ID, ctx)

    const wrapper = mount(SpotlightOverlay)
    await nextTick()
    expect(moveListenerCalls(addSpy)).toBe(1)

    // repeated settings emissions with enabled still true (e.g. radius tweaks)
    emit({ ...baseSettings, enabled: true, radius: 200 })
    await nextTick()
    emit({ ...baseSettings, enabled: true, dimOpacity: 0.9 })
    await nextTick()
    emit({ ...baseSettings, enabled: true })
    await nextTick()

    expect(moveListenerCalls(addSpy)).toBe(1)
    expect(moveListenerCalls(removeSpy)).toBe(0)

    wrapper.unmount()
  })

  it('re-attaches on a second enable without leaking, across off/on/off cycles', async () => {
    const { ctx, emit } = makeFakeContext({ ...baseSettings, enabled: true })
    setModuleContext(MODULE_ID, ctx)

    const wrapper = mount(SpotlightOverlay)
    await nextTick()
    expect(moveListenerCalls(addSpy)).toBe(1)

    emit({ ...baseSettings, enabled: false })
    await nextTick()
    emit({ ...baseSettings, enabled: true })
    await nextTick()
    emit({ ...baseSettings, enabled: false })
    await nextTick()

    // 2 attaches (initial + re-enable), 2 detaches (disable + disable)
    expect(moveListenerCalls(addSpy)).toBe(2)
    expect(moveListenerCalls(removeSpy)).toBe(2)

    wrapper.unmount()
  })

  it('clears the listener and unsubscribes from settings on unmount', async () => {
    const { ctx, emit, subscriberCount } = makeFakeContext({
      ...baseSettings,
      enabled: true,
    })
    setModuleContext(MODULE_ID, ctx)

    const wrapper = mount(SpotlightOverlay)
    await nextTick()
    expect(moveListenerCalls(addSpy)).toBe(1)
    expect(subscriberCount()).toBe(1)

    wrapper.unmount()

    expect(moveListenerCalls(removeSpy)).toBe(1)
    expect(subscriberCount()).toBe(0)

    // post-unmount settings emission MUST NOT re-attach a listener
    const addAfter = moveListenerCalls(addSpy)
    emit({ ...baseSettings, enabled: true })
    await nextTick()
    expect(moveListenerCalls(addSpy)).toBe(addAfter)
  })

  it('seeds --x/--y at viewport centre on enable so the hole never flashes top-left', async () => {
    // Pin viewport dimensions so the expected centre is deterministic.
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    const { ctx } = makeFakeContext({ ...baseSettings, enabled: true })
    setModuleContext(MODULE_ID, ctx)

    const wrapper = mount(SpotlightOverlay)
    await nextTick()

    const el = wrapper.find('[data-testid="spotlight-overlay"]').element as HTMLElement
    // Before any mousemove the hole MUST sit at the centre, not 0,0.
    expect(el.style.getPropertyValue('--x')).toBe('640px')
    expect(el.style.getPropertyValue('--y')).toBe('400px')

    wrapper.unmount()
  })

  it('updates the rendered mask/backdrop when settings change while enabled', async () => {
    const { ctx, emit } = makeFakeContext({ ...baseSettings, enabled: true })
    setModuleContext(MODULE_ID, ctx)

    const wrapper = mount(SpotlightOverlay)
    await nextTick()
    const el = wrapper.find('[data-testid="spotlight-overlay"]').element as HTMLElement
    expect(el.style.background).toBe('rgba(0, 0, 0, 0.8)')

    emit({ ...baseSettings, enabled: true, dimOpacity: 0.9 })
    await nextTick()
    expect(el.style.background).toBe('rgba(0, 0, 0, 0.9)')
  })
})
