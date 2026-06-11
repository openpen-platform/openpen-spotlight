<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppSlider, AppToggle } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'

interface SpotlightSettings {
  radius: number
  dimOpacity: number
  softEdge: boolean
}

const ctx = useModuleContext(MODULE_ID)

const radius = ref(150)
const dimOpacity = ref(0.8)
const softEdge = ref(true)
let unsub: (() => void) | null = null

onMounted(() => {
  const s = ctx.getSettings<SpotlightSettings>()
  radius.value = s.radius ?? 150
  dimOpacity.value = s.dimOpacity ?? 0.8
  softEdge.value = s.softEdge ?? true
  unsub = ctx.onSettingsChange<SpotlightSettings>((next) => {
    radius.value = next.radius
    dimOpacity.value = next.dimOpacity
    softEdge.value = next.softEdge
  })
})

onUnmounted(() => unsub?.())

const radiusLabel = computed(() => ctx.t('settings.radius'))
const dimOpacityLabel = computed(() => ctx.t('settings.dimOpacity'))
const softEdgeLabel = computed(() => ctx.t('settings.softEdge'))

const dimPercent = computed(() => Math.round(dimOpacity.value * 100))

async function setRadius(value: number) {
  radius.value = value
  await ctx.updateSettings<SpotlightSettings>({ radius: value })
}

async function setDimPercent(value: number) {
  const opacity = value / 100
  dimOpacity.value = opacity
  await ctx.updateSettings<SpotlightSettings>({ dimOpacity: opacity })
}

async function setSoftEdge(value: boolean) {
  softEdge.value = value
  await ctx.updateSettings<SpotlightSettings>({ softEdge: value })
}
</script>

<template>
  <div class="spotlight-settings">
    <div class="spotlight-row">
      <div class="spotlight-row-label">{{ radiusLabel }}</div>
      <div class="spotlight-row-value">{{ radius }}px</div>
    </div>
    <AppSlider
      :model-value="radius"
      :min="60"
      :max="400"
      :step="1"
      @update:model-value="setRadius"
    />

    <div class="spotlight-row">
      <div class="spotlight-row-label">{{ dimOpacityLabel }}</div>
      <div class="spotlight-row-value">{{ dimPercent }}%</div>
    </div>
    <AppSlider
      :model-value="dimPercent"
      :min="10"
      :max="95"
      :step="1"
      @update:model-value="setDimPercent"
    />

    <div class="spotlight-row">
      <div class="spotlight-row-label">{{ softEdgeLabel }}</div>
      <AppToggle
        :model-value="softEdge"
        :aria-label="softEdgeLabel"
        @update:model-value="setSoftEdge"
      />
    </div>
  </div>
</template>

<style scoped>
.spotlight-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spotlight-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spotlight-row-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--openpen-color-text-primary);
}

.spotlight-row-value {
  font-size: 12.5px;
  color: var(--openpen-color-text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
