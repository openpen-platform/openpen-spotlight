/**
 * @openpen/spotlight — dims the screen except a soft circle that follows the
 * cursor, focusing the audience's attention.
 *
 * Contributes:
 *   - An always-mounted HTML overlay (`canvas.html.overlay`) that paints the
 *     dim backdrop with a CSS `mask` radial-gradient hole at the cursor. The
 *     mask is GPU-composited, so cursor tracking only mutates `--x`/`--y` CSS
 *     variables — no per-frame JS repaint. When `enabled` is false the overlay
 *     renders nothing and detaches its mousemove listener.
 *   - A control-bar toggle button (`ui.control-bar`) whose active state mirrors
 *     the persisted `enabled` flag.
 *   - A settings panel (`ui.settings.panels`) for radius / dim level / soft edge.
 *
 * All visual math (mask gradient string, feather band, backdrop colour) lives
 * in the side-effect-free `spotlight-mask.ts` so it stays unit-testable.
 *
 * No drawing tool, no stroke commit — spotlight is a passive, pointer-events:none
 * overlay that never intercepts the operations underneath it.
 */
import { defineModule, z } from '@openpen/module-api'
export { MODULE_ID } from './module-id'
import { MODULE_ID } from './module-id'
import SpotlightOverlay from './SpotlightOverlay.vue'
import SpotlightToggleButton from './SpotlightToggleButton.vue'
import SpotlightSettingsPanel from './SpotlightSettingsPanel.vue'
import en from './locales/en.json'
import zhHant from './locales/zh-Hant.json'
import zhHans from './locales/zh-Hans.json'
import ja from './locales/ja.json'

const settingsSchema = z.object({
  enabled: z.boolean().default(false),
  radius: z.number().min(60).max(400).default(150),
  dimOpacity: z.number().min(0.1).max(0.95).default(0.8),
  softEdge: z.boolean().default(true),
})

export default defineModule({
  id: MODULE_ID,
  version: '1.0.0',
  settingsSchema,

  contributes: {
    htmlOverlays: [
      {
        id: 'spotlight',
        component: SpotlightOverlay,
      },
    ],
    controlBar: [
      {
        id: 'spotlight',
        component: SpotlightToggleButton,
        defaultGroup: 'tools',
        groupHint: { separator: 'auto' },
      },
    ],
    settingsPanels: [
      {
        id: 'spotlight-settings',
        label: {
          en: 'Spotlight',
          'zh-Hant': '聚光燈',
          'zh-Hans': '聚光灯',
          ja: 'スポットライト',
        },
        component: SpotlightSettingsPanel,
      },
    ],
    locales: {
      en,
      'zh-Hant': zhHant,
      'zh-Hans': zhHans,
      ja,
    },
  },
})
