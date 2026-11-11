<script setup lang="ts">
/*
 * SpotlightToggleButton — spotlight on/off button + caret + options popover.
 *
 * Same pattern as the host's shape and eraser buttons (and the arrow plugin):
 * an `AppButtonDropdown` whose main button toggles the spotlight and whose
 * caret opens a popover with the adjustments (radius, dim level, soft edge).
 * Popover lifecycle (mutual exclusion with other popovers, outside-click,
 * placement, vertical bars) is handled by the dropdown's inner AppPopover.
 *
 * The popover writes to this plugin's settings; the overlay in every window
 * picks the change up through onSettingsChange, so the spotlight reshapes
 * immediately while the slider moves.
 */
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { MODAL_MANAGER_KEY, SNAP_EDGE_KEY, useModuleContext } from '@openpen/module-api'
import { AppButtonDropdown, AppSlider, AppToggle } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import { vSliderName, vSwitchState } from './a11y-workarounds'
import {
  DIM_DEFAULT,
  DIM_MAX,
  DIM_MIN,
  RADIUS_DEFAULT,
  RADIUS_MAX,
  RADIUS_MIN,
  clampDimOpacity,
  clampRadius,
} from './spotlight-settings'

interface SpotlightSettings {
  enabled: boolean
  radius: number
  dimOpacity: number
  softEdge: boolean
}

const POPOVER_ID = 'openpen-spotlight-options'

const ctx = useModuleContext(MODULE_ID)
const label = computed(() => ctx.t('toggle'))
const optionsLabel = computed(() => ctx.t('options.label'))
const radiusLabel = computed(() => ctx.t('settings.radius'))
const dimLabel = computed(() => ctx.t('settings.dimOpacity'))
const softEdgeLabel = computed(() => ctx.t('settings.softEdge'))

const snapEdge = inject(SNAP_EDGE_KEY)
const modalManager = inject(MODAL_MANAGER_KEY)
// Anchor coordinates go stale when the bar snaps to another edge.
watch(() => snapEdge?.value, () => { modalManager?.close(POPOVER_ID) })

const enabled = ref(false)
const radius = ref(RADIUS_DEFAULT)
const dimOpacity = ref(DIM_DEFAULT)
const softEdge = ref(true)
const dimPercent = computed(() => Math.round(dimOpacity.value * 100))

function apply(s: Partial<SpotlightSettings>) {
  enabled.value = s.enabled ?? false
  radius.value = clampRadius(s.radius as number)
  dimOpacity.value = clampDimOpacity(s.dimOpacity as number)
  softEdge.value = s.softEdge ?? true
}

let unsub: (() => void) | null = null
onMounted(() => {
  apply(ctx.getSettings<SpotlightSettings>())
  unsub = ctx.onSettingsChange<SpotlightSettings>(apply)
})
onUnmounted(() => unsub?.())

async function toggle() {
  await ctx.updateSettings<SpotlightSettings>({ enabled: !enabled.value })
}

/** Opening the options also turns the spotlight on, so the adjustments are visible as they are made. */
async function enableIfNeeded() {
  if (!enabled.value) await ctx.updateSettings<SpotlightSettings>({ enabled: true })
}

async function setRadius(value: number) {
  const next = clampRadius(Number(value))
  radius.value = next
  await ctx.updateSettings<SpotlightSettings>({ radius: next })
}

async function setDimPercent(value: number) {
  const next = clampDimOpacity(Number(value) / 100)
  dimOpacity.value = next
  await ctx.updateSettings<SpotlightSettings>({ dimOpacity: next })
}

async function setSoftEdge(value: boolean) {
  softEdge.value = value
  await ctx.updateSettings<SpotlightSettings>({ softEdge: value })
}
</script>

<template>
  <AppButtonDropdown
    :popover-id="POPOVER_ID"
    popover-placement="auto"
    :active="enabled"
    :main-tooltip="label"
    :main-aria-label="label"
    :caret-aria-label="optionsLabel"
    main-testid="controlbar-spotlight-btn"
    caret-testid="controlbar-spotlight-caret"
    @main-click="toggle"
    @caret-click="enableIfNeeded"
  >
    <template #main-content>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.9" y1="4.9" x2="7" y2="7" />
        <line x1="17" y1="17" x2="19.1" y2="19.1" />
        <line x1="4.9" y1="19.1" x2="7" y2="17" />
        <line x1="17" y1="7" x2="19.1" y2="4.9" />
      </svg>
    </template>
    <template #popover-content>
      <div class="spotlight-popover" data-testid="controlbar-spotlight-popover">
        <div class="spotlight-popover-head">
          <span class="spotlight-popover-title">{{ radiusLabel }}</span>
          <span class="spotlight-popover-value" data-testid="spotlight-radius-value">{{ radius }}px</span>
        </div>
        <div v-slider-name="radiusLabel">
          <AppSlider
            :model-value="radius"
            :min="RADIUS_MIN"
            :max="RADIUS_MAX"
            :step="1"
            track-height="8px"
            track-radius="4px"
            thumb-width="24px"
            thumb-height="16px"
            thumb-radius="8px"
            data-testid="spotlight-radius-slider"
            @update:model-value="setRadius"
          />
        </div>

        <div class="spotlight-popover-head spotlight-popover-gap">
          <span class="spotlight-popover-title">{{ dimLabel }}</span>
          <span class="spotlight-popover-value" data-testid="spotlight-dim-value">{{ dimPercent }}%</span>
        </div>
        <div v-slider-name="dimLabel">
          <AppSlider
            :model-value="dimPercent"
            :min="Math.round(DIM_MIN * 100)"
            :max="Math.round(DIM_MAX * 100)"
            :step="1"
            track-height="8px"
            track-radius="4px"
            thumb-width="24px"
            thumb-height="16px"
            thumb-radius="8px"
            data-testid="spotlight-dim-slider"
            @update:model-value="setDimPercent"
          />
        </div>

        <div class="spotlight-popover-head spotlight-popover-gap">
          <span class="spotlight-popover-title">{{ softEdgeLabel }}</span>
          <div v-switch-state>
            <AppToggle
              :model-value="softEdge"
              :aria-label="softEdgeLabel"
              data-testid="spotlight-soft-edge-toggle"
              @update:model-value="setSoftEdge"
            />
          </div>
        </div>
      </div>
    </template>
  </AppButtonDropdown>
</template>

<style scoped>
/*
 * Popover layout mirrors the host's stroke-width popup (same local copy as the
 * arrow plugin): the host keeps its popover styles in a global stylesheet
 * plugins cannot import, so this is built on the public --openpen-* tokens.
 * Scoped styles still apply: the slot content is rendered by this component
 * even though the popover teleports it.
 *
 * One column in both bar orientations, so vertical bars need no variant;
 * AppPopover places it beside the bar. min-width gives AppSlider
 * (width: 100%) a reference width.
 */
.spotlight-popover {
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spotlight-popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spotlight-popover-gap {
  margin-top: 8px;
}

.spotlight-popover-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  /* text-muted fails 4.5:1 on the popup surface (2.45-3.66:1 measured); text-dim passes. */
  color: var(--openpen-color-text-dim);
}

.spotlight-popover-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--openpen-color-text-primary);
  font-variant-numeric: tabular-nums;
}
</style>
