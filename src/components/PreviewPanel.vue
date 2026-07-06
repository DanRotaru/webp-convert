<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQueue } from '@/composables/useFileQueue'
import { fileExt, formatBytes } from '@/utils/format'
import { resizeToBlob } from '@/utils/image'

const ZOOM_MIN = 0.25
const ZOOM_MAX = 8
const ZOOM_STEP = 1.25

const props = defineProps({
  mode: { type: String, required: true },
})

const { selected, showPreview } = useQueue(props.mode)

const compareDiv = ref(null)
const orgImgEl = ref(null)
const modImgEl = ref(null)
const sliderEl = ref(null)

const orgUrl = ref('data:,')
const modUrl = ref('data:,')
const orgLoaded = ref(false)
const modLoaded = ref(false)
const zoom = ref(1)
const panning = ref(false)

const isDone = computed(() => selected.value?.state === 'done')
const bothLoaded = computed(() => orgLoaded.value && modLoaded.value)
const zoomLabel = computed(() => Math.round(zoom.value * 100) + '%')

const outLabel = computed(() => {
  if (!selected.value) return ''
  return props.mode === 'convert' ? 'WebP' : fileExt(selected.value.outName || selected.value.file.name).toUpperCase()
})
const savingsText = computed(() => {
  const item = selected.value
  if (!item?.blob) return ''
  const pct = 100 - Math.round((100 * item.blob.size) / item.file.size)
  if (pct > 0) return `−${pct}%`
  if (pct < 0) return `+${-pct}%`
  return '±0%'
})

let sliderPos = 0.5 // fraction of the compare box width
let pan = { x: 0, y: 0 }
let draggingSlider = false
let panPointer = null

function revokePreviews() {
  if (orgUrl.value.startsWith('blob:')) URL.revokeObjectURL(orgUrl.value)
  if (modUrl.value.startsWith('blob:')) URL.revokeObjectURL(modUrl.value)
}

async function init() {
  const item = selected.value
  revokePreviews()
  orgLoaded.value = false
  modLoaded.value = false
  orgUrl.value = 'data:,'
  modUrl.value = 'data:,'
  sliderPos = 0.5
  zoom.value = 1
  pan = { x: 0, y: 0 }
  if (!item || item.state !== 'done') return

  modUrl.value = URL.createObjectURL(item.blob)
  // Lossless resize of the source for the "Before" half of the comparison
  const orgBlob = await resizeToBlob(item.file, item.resize)
  if (selected.value !== item) return
  orgUrl.value = URL.createObjectURL(orgBlob)
}

function onOrgLoad() {
  if (orgUrl.value === 'data:,') return
  orgLoaded.value = true
  applyView()
}

function onModLoad() {
  if (modUrl.value === 'data:,') return
  modLoaded.value = true
  applyView()
}

/**
 * Positions both images (pan + zoom around the box center) and clips each
 * side at the divider. Clip coordinates are in the image's own (unscaled)
 * space, so the divider's screen position is mapped back through the
 * current transform.
 */
function applyView() {
  const box = compareDiv.value
  const slider = sliderEl.value
  if (!box || !slider) return
  const boxW = box.offsetWidth
  const x = sliderPos * boxW
  slider.style.left = x + 'px'
  const transform = `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom.value})`
  for (const [el, side] of [
    [orgImgEl.value, 'left'],
    [modImgEl.value, 'right'],
  ]) {
    if (!el) continue
    el.style.transform = transform
    const w = el.offsetWidth
    const h = el.offsetHeight
    const edge = Math.min(w, Math.max(0, (x - boxW / 2 - pan.x) / zoom.value + w / 2))
    el.style.clip =
      side === 'left' ? `rect(0,${edge}px,${h}px,0)` : `rect(0,${w}px,${h}px,${edge}px)`
  }
}

// --- divider drag ---
function onSliderDown(event) {
  event.preventDefault()
  event.stopPropagation()
  draggingSlider = true
  sliderEl.value?.setPointerCapture?.(event.pointerId)
}

function onSliderMove(event) {
  if (!draggingSlider) return
  const rect = compareDiv.value.getBoundingClientRect()
  sliderPos = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  applyView()
}

function onSliderUp() {
  draggingSlider = false
}

// --- canvas pan (drag to move, wheel to zoom at cursor) ---
function onCanvasDown(event) {
  if (event.target.closest('.compare-divider') || event.target.closest('.zoom-tools')) return
  event.preventDefault()
  panning.value = true
  panPointer = { x: event.clientX, y: event.clientY }
  compareDiv.value?.setPointerCapture?.(event.pointerId)
}

function onCanvasMove(event) {
  if (!panning.value || !panPointer) return
  pan.x += event.clientX - panPointer.x
  pan.y += event.clientY - panPointer.y
  panPointer = { x: event.clientX, y: event.clientY }
  applyView()
}

function onCanvasUp() {
  panning.value = false
  panPointer = null
}

/** Zooms keeping the box point (cx, cy — relative to box center) fixed. */
function zoomAt(cx, cy, factor) {
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom.value * factor))
  const k = next / zoom.value
  if (k === 1) return
  pan.x = cx - (cx - pan.x) * k
  pan.y = cy - (cy - pan.y) * k
  zoom.value = next
  applyView()
}

function zoomStep(factor) {
  zoomAt(0, 0, factor)
}

function onWheel(event) {
  const rect = compareDiv.value.getBoundingClientRect()
  const cx = event.clientX - rect.left - rect.width / 2
  const cy = event.clientY - rect.top - rect.height / 2
  zoomAt(cx, cy, event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP)
}

function resetView() {
  zoom.value = 1
  pan = { x: 0, y: 0 }
  sliderPos = 0.5
  applyView()
}

// Re-init when another file is picked or the current one is re-encoded
watch([selected, () => selected.value?.url], init)

// The panel is kept mounted while hidden (v-show), so sizes are stale when it reappears
watch(showPreview, (visible) => {
  if (visible) nextTick(applyView)
})

onMounted(() => {
  init()
  window.addEventListener('resize', applyView)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', applyView)
  revokePreviews()
})
</script>

<template>
  <section class="panel preview-panel">
    <template v-if="selected">
      <header class="panel-head preview-head">
        <h2 class="preview-name" :title="selected.file.name">{{ selected.file.name }}</h2>
        <div class="preview-dims">
          <span class="dim-block">
            <span class="dim-label">Original</span>
            <span class="dim-value">{{ selected.srcWidth ? `${selected.srcWidth}×${selected.srcHeight}` : '…' }} · {{ formatBytes(selected.file.size) }}</span>
          </span>
          <span class="dim-arrow">→</span>
          <span class="dim-block">
            <span class="dim-label">{{ outLabel }}</span>
            <span class="dim-value">
              <template v-if="isDone">{{ selected.outWidth }}×{{ selected.outHeight }} · {{ formatBytes(selected.blob.size) }}
                <em class="dim-savings">{{ savingsText }}</em></template>
              <template v-else>processing…</template>
            </span>
          </span>
        </div>
      </header>

      <div ref="compareDiv" class="compare-box" :class="{ panning }"
           @pointerdown="onCanvasDown"
           @pointermove="onCanvasMove"
           @pointerup="onCanvasUp"
           @pointercancel="onCanvasUp"
           @wheel.prevent="onWheel">
        <template v-if="isDone">
          <span class="compare-chip chip-before">Before</span>
          <span class="compare-chip chip-after">After</span>
          <img ref="orgImgEl" class="compare-img" :class="{ tilesPattern: selected.transparent }"
               :src="orgUrl" alt="" draggable="false" @load="onOrgLoad"/>
          <img ref="modImgEl" class="compare-img" :class="{ tilesPattern: selected.transparent }"
               :src="modUrl" alt="" draggable="false" @load="onModLoad"/>
          <div ref="sliderEl" class="compare-divider"
               @pointerdown="onSliderDown"
               @pointermove="onSliderMove"
               @pointerup="onSliderUp"
               @pointercancel="onSliderUp">
            <span class="divider-handle">
              <svg viewBox="0 0 8 16" width="6" height="12" style="transform: scaleX(-1)"><use href="#arrow-right"></use></svg>
              <svg viewBox="0 0 8 16" width="6" height="12"><use href="#arrow-right"></use></svg>
            </span>
          </div>
          <div class="zoom-tools">
            <button class="zoom-btn" type="button" title="Zoom out" @click="zoomStep(1 / ZOOM_STEP)">&minus;</button>
            <button class="zoom-level" type="button" title="Reset view" @click="resetView">{{ zoomLabel }}</button>
            <button class="zoom-btn" type="button" title="Zoom in" @click="zoomStep(ZOOM_STEP)">+</button>
          </div>
          <div v-show="!bothLoaded" class="compare-loading"><span class="spinner"></span></div>
        </template>
        <div v-else-if="selected.state === 'error'" class="preview-empty">
          <p>This file could not be processed.</p>
        </div>
        <div v-else class="preview-empty">
          <span class="spinner"></span>
          <p>Processing {{ selected.file.name }}…</p>
        </div>
      </div>
    </template>

    <div v-else class="preview-empty preview-placeholder">
      <svg viewBox="0 0 24 24" width="44" height="44"><use href="#image"></use></svg>
      <p class="preview-empty-title">Nothing to preview yet</p>
      <p class="preview-empty-sub">Add images and pick one from the queue to compare before &amp; after.</p>
    </div>
  </section>
</template>
