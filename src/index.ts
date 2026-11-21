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
 *     the persisted `enabled` flag, with a caret that opens a popover for
 *     radius / dim level / soft edge.
 *   - A global shortcut that toggles `enabled`.
 *
 * All visual math (mask gradient string, feather band, backdrop colour) lives
 * in the side-effect-free `spotlight-mask.ts` so it stays unit-testable.
 *
 * No drawing tool, no stroke commit — spotlight is a passive, pointer-events:none
 * overlay that never intercepts the operations underneath it.
 */
import { defineModule, z, type ModuleSetupContext } from '@openpen/module-api'
export { MODULE_ID } from './module-id'
import { MODULE_ID } from './module-id'
import SpotlightOverlay from './SpotlightOverlay.vue'
import SpotlightToggleButton from './SpotlightToggleButton.vue'
import { DIM_DEFAULT, RADIUS_DEFAULT } from './spotlight-settings'
import en from './locales/en.json'
import zhHant from './locales/zh-Hant.json'
import zhHans from './locales/zh-Hans.json'
import ja from './locales/ja.json'

const settingsSchema = z.object({
  enabled: z.boolean().default(false),
  // Unbounded on purpose: an out-of-range saved value is clamped on read
  // (spotlight-settings.ts) instead of failing validation and discarding the
  // whole settings object.
  radius: z.number().default(RADIUS_DEFAULT),
  dimOpacity: z.number().default(DIM_DEFAULT),
  softEdge: z.boolean().default(true),
})

type SpotlightSettings = z.infer<typeof settingsSchema>

// The shortcut handler has no context argument, so setup() hands it over.
let activeCtx: ModuleSetupContext | null = null

// The host delivers one shortcut press to exactly one window, so the handler
// runs once per press and needs no de-duplication of its own.

/** Flip the persisted `enabled` flag; every window (and the control-bar button) follows via onSettingsChange. */
function toggleSpotlight(): void {
  if (!activeCtx) return
  const enabled = activeCtx.getSettings<SpotlightSettings>().enabled ?? false
  void activeCtx.updateSettings<SpotlightSettings>({ enabled: !enabled })
}

export default defineModule({
  id: MODULE_ID,
  version: '1.1.0',
  settingsSchema,

  setup(ctx) {
    activeCtx = ctx
    ctx.onDispose(() => {
      if (activeCtx === ctx) activeCtx = null
    })
  },

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
    shortcuts: [
      {
        id: 'toggle-spotlight',
        // Host convention: CommandOrControl + modifier + letter. S = Spotlight;
        // Alt instead of Shift because CommandOrControl+Shift+S is taken by the
        // host. Global scope: the spotlight overlay is also used outside
        // drawing mode, so the key must work there too. Users can rebind it in
        // Settings -> Shortcuts.
        keys: 'CommandOrControl+Alt+S',
        scope: 'global',
        label: {
          en: 'Toggle Spotlight',
          'zh-Hant': '開關聚光燈',
          'zh-Hans': '开关聚光灯',
          ja: 'スポットライトの切り替え',
        },
        userCustomizable: true,
        handler: toggleSpotlight,
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
