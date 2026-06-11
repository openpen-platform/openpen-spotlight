<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppButton } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'

interface SpotlightSettings {
  enabled: boolean
}

const ctx = useModuleContext(MODULE_ID)
const label = computed(() => ctx.t('toggle'))

const enabled = ref(false)
let unsub: (() => void) | null = null

onMounted(() => {
  enabled.value = ctx.getSettings<SpotlightSettings>().enabled ?? false
  unsub = ctx.onSettingsChange<SpotlightSettings>((s) => {
    enabled.value = s.enabled ?? false
  })
})

onUnmounted(() => unsub?.())

async function toggle() {
  await ctx.updateSettings<SpotlightSettings>({ enabled: !enabled.value })
}
</script>

<template>
  <AppButton
    :active="enabled"
    :tooltip="label"
    :aria-label="label"
    data-testid="controlbar-spotlight-btn"
    @click="toggle"
  >
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
  </AppButton>
</template>
