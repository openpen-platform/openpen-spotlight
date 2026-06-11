<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { MODULE_ID } from './module-id'
import {
  backdropColor,
  maskGradient,
  type SpotlightConfig,
} from './spotlight-mask'

interface SpotlightSettings extends SpotlightConfig {
  enabled: boolean
}

const ctx = useModuleContext(MODULE_ID)

const enabled = ref(false)
const config = ref<SpotlightConfig>({ radius: 150, dimOpacity: 0.8, softEdge: true })

// Seed at viewport centre so the hole never flashes the top-left corner on the
// first paint before any mousemove arrives.
const x = ref(typeof window !== 'undefined' ? window.innerWidth / 2 : 0)
const y = ref(typeof window !== 'undefined' ? window.innerHeight / 2 : 0)

let unsubSettings: (() => void) | null = null
let listening = false

function onMove(e: MouseEvent) {
  x.value = e.clientX
  y.value = e.clientY
}

/**
 * Tie the global mousemove listener strictly to `enabled`. When the spotlight
 * is off we keep zero listeners so a disabled plugin leaves no trace (the
 * no-pollution audit inspects getEventListeners). Idempotent: guarded by
 * `listening` so repeated settings emissions never double-register.
 */
function startTracking() {
  if (listening) return
  window.addEventListener('mousemove', onMove, { passive: true })
  listening = true
}

function stopTracking() {
  if (!listening) return
  window.removeEventListener('mousemove', onMove)
  listening = false
}

function apply(s: SpotlightSettings) {
  enabled.value = s.enabled ?? false
  config.value = {
    radius: s.radius,
    dimOpacity: s.dimOpacity,
    softEdge: s.softEdge,
  }
}

watch(
  enabled,
  (on) => {
    if (on) startTracking()
    else stopTracking()
  },
  { immediate: true },
)

onMounted(() => {
  apply(ctx.getSettings<SpotlightSettings>())
  unsubSettings = ctx.onSettingsChange<SpotlightSettings>(apply)
})

onUnmounted(() => {
  stopTracking()
  unsubSettings?.()
})

const maskValue = computed(() => maskGradient(config.value))
const backdrop = computed(() => backdropColor(config.value.dimOpacity))
</script>

<template>
  <div
    v-if="enabled"
    class="spotlight"
    data-testid="spotlight-overlay"
    :style="{
      '--x': x + 'px',
      '--y': y + 'px',
      background: backdrop,
      WebkitMaskImage: maskValue,
      maskImage: maskValue,
    }"
  />
</template>

<style scoped>
.spotlight {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
</style>
