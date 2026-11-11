import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { clearModuleContext, setModuleContext, type ModuleSetupContext } from '@openpen/module-api'
import SpotlightSettingsPanel from '../src/SpotlightSettingsPanel.vue'
import SpotlightToggleButton from '../src/SpotlightToggleButton.vue'
import { MODULE_ID } from '../src/module-id'

describe('panel accessibility (axe: aria-input-field-name, aria-allowed-attr)', () => {
  afterEach(() => clearModuleContext(MODULE_ID))

  it('in the popover and the settings panel, each slider thumb is named and the switch carries no aria-pressed', async () => {
    const ctx = {
      moduleId: MODULE_ID,
      locale: 'en',
      getSettings: () => ({ enabled: true, radius: 150, dimOpacity: 0.8, softEdge: true }),
      updateSettings: async () => {},
      onSettingsChange: () => () => {},
      t: (key: string) => key,
    } as unknown as ModuleSetupContext
    setModuleContext(MODULE_ID, ctx)

    // The dropdown shell needs the host to open its popover; render its slots inline.
    const shell = { template: '<div><slot name="main-content" /><slot name="popover-content" /></div>' }
    const button = mount(SpotlightToggleButton, { attachTo: document.body, global: { stubs: { AppButtonDropdown: shell } } })
    await nextTick()
    const panel = mount(SpotlightSettingsPanel, { attachTo: document.body })
    await nextTick()

    for (const w of [button, panel]) {
      expect(w.findAll('[role="slider"]').map((t) => t.attributes('aria-label'))).toEqual([
        'settings.radius',
        'settings.dimOpacity',
      ])
      const sw = w.find('[role="switch"]')
      expect(sw.exists()).toBe(true)
      expect(sw.attributes('aria-pressed')).toBeUndefined()
    }
  })
})
