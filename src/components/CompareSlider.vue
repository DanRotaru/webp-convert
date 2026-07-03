<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCompare } from '@/composables/useCompare'
import { useFileQueue } from '@/composables/useFileQueue'
import { formatBytes } from '@/utils/format'
import { encodeWebp, resizeToBlob } from '@/utils/image'

const ZOOM_MIN = 0.25
const ZOOM_MAX = 8
const ZOOM_STEP = 1.25

const { activeItem, close } = useCompare()
const { updateBlob } = useFileQueue()

const compareDiv = ref(null)
const orgImgEl = ref(null)
const modImgEl = ref(null)
const sliderEl = ref(null)

const orgUrl = ref('data:,')
const modUrl = ref('data:,')
const orgLoaded = ref(false)
const modLoaded = ref(false)
const orgSizeText = ref('---')
const modSizeText = ref('---')
const qualityPct = ref(80)
const adjusting = ref(false)
const applied = ref(false)
const zoom = ref(1)
const panning = ref(false)

const bothLoaded = computed(() => orgLoaded.value && modLoaded.value)
const zoomLabel = computed(() => Math.round(zoom.value * 100) + '%')
const canApply = ref(false)

let orgSize = 0
let modSize = 0
let tempBlob = null
let sliderPos = 0.5 // fraction of the compare box width
let pan = { x: 0, y: 0 }
let draggingSlider = false
let panPointer = null

function revokePreviews() {
  if (orgUrl.value.startsWith('blob:')) URL.revokeObjectURL(orgUrl.value)
  if (modUrl.value.startsWith('blob:')) URL.revokeObjectURL(modUrl.value)
}

async function init() {
  const item = activeItem.value
  if (!item) return
  revokePreviews()
  orgLoaded.value = false
  modLoaded.value = false
  orgSizeText.value = '---'
  modSizeText.value = '---'
  applied.value = false
  adjusting.value = false
  canApply.value = false
  tempBlob = null
  orgSize = 0
  modSize = 0
  sliderPos = 0.5
  zoom.value = 1
  pan = { x: 0, y: 0 }
  qualityPct.value = Math.round(item.quality * 100)

  modUrl.value = URL.createObjectURL(item.blob)
  modSize = item.blob.size
  // Lossless resize of the source for the "Original" half of the comparison
  const orgBlob = await resizeToBlob(item.file, item.resize)
  if (activeItem.value !== item) return
  orgUrl.value = URL.createObjectURL(orgBlob)
  orgSize = item.file.size

  nextTick(() => document.getElementById('sliderCont')?.scrollIntoView({ behavior: 'smooth' }))
}

function sizeLabel(size, withPercent) {
  let label = formatBytes(size)
  if (withPercent && orgSize !== 0 && modSize !== 0) {
    const percent = 100 - parseInt(100 * (modSize / orgSize))
    if (percent > 0 && percent < 100) label += ` (${percent}%)`
  }
  return label
}

function onOrgLoad() {
  orgLoaded.value = true
  orgSizeText.value = sizeLabel(orgSize, false)
  applyView()
}

function onModLoad() {
  modLoaded.value = true
  modSizeText.value = sizeLabel(modSize, true)
  if (adjusting.value) {
    adjusting.value = false
    canApply.value = true
  }
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

// --- canvas pan (Figma-style: drag to move, wheel to zoom at cursor) ---
function onCanvasDown(event) {
  if (event.target.closest('#slider') || event.target.closest('#zoomTools')) return
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

// --- quality adjust ---
function onQualityInput() {
  applied.value = false
}

async function onQualityChange() {
  const item = activeItem.value
  if (!item) return
  adjusting.value = true
  canApply.value = false
  try {
    const blob = await encodeWebp(item.file, item.resize, qualityPct.value / 100)
    if (activeItem.value !== item) return
    tempBlob = blob
    modSize = blob.size
    if (modUrl.value.startsWith('blob:')) URL.revokeObjectURL(modUrl.value)
    modUrl.value = URL.createObjectURL(blob) // onModLoad clears the loader
  } catch {
    adjusting.value = false
  }
}

function apply() {
  const item = activeItem.value
  if (!item || !tempBlob) return
  updateBlob(item, tempBlob, qualityPct.value / 100)
  applied.value = true
}

watch(activeItem, (item) => {
  if (item) init()
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
  <div id="sliderCont">
    <h2 id="sliderHD"><span id="sliderSpanOuter"><span id="sliderSpan">Adjust Quality</span></span></h2>
    <div v-show="!bothLoaded" id="loaderImages">
      <span class="loader"><span class="loader-inner"></span></span> Loading images...
    </div>
    <svg id="closeSlider" class="close" viewBox="0 0 12 13" width="16" height="16" @click="close">
      <use href="#close"></use>
    </svg>
    <div id="sizesCont">
      <div id="imgInfo">
        <p>Original: <span id="orgSize">{{ orgSizeText }}</span></p>
        <p>Preview: <span id="modSize">{{ modSizeText }}</span></p>
      </div>
      <div id="imgNames">
        <p id="orgNM">{{ activeItem?.file.name }}</p>
        <p id="modNM">{{ activeItem?.outName }}</p>
      </div>
      <div id="compareDiv" ref="compareDiv" :class="{ panning }"
           @pointerdown="onCanvasDown"
           @pointermove="onCanvasMove"
           @pointerup="onCanvasUp"
           @pointercancel="onCanvasUp"
           @wheel.prevent="onWheel">
        <img id="orgImg" ref="orgImgEl" class="centerImg" :src="orgUrl" alt="" draggable="false" @load="onOrgLoad"/>
        <img id="modImg" ref="modImgEl" class="centerImg" :src="modUrl" alt="" draggable="false" @load="onModLoad"/>
        <div id="slider" ref="sliderEl"
             @pointerdown="onSliderDown"
             @pointermove="onSliderMove"
             @pointerup="onSliderUp"
             @pointercancel="onSliderUp">
          <span class="sliderLeftArrow"></span><span class="sliderRightArrow"></span>
        </div>
        <div id="zoomTools">
          <button class="zoomBtn" type="button" title="Zoom out" @click="zoomStep(1 / ZOOM_STEP)">&minus;</button>
          <button id="zoomLevel" type="button" title="Reset view" @click="resetView">{{ zoomLabel }}</button>
          <button class="zoomBtn" type="button" title="Zoom in" @click="zoomStep(ZOOM_STEP)">+</button>
        </div>
      </div>
    </div>
    <div id="qualityDiv">
      <div id="qualityLoader">
        <div v-show="adjusting" id="qualityLoaderCont">
          <span class="loader"><span class="loader-inner"></span></span>
        </div>
      </div>
      <label id="qualityLbl">Quality</label>
      <div id="quality">{{ qualityPct }}</div>
      <div id="qualitySliderDiv">
        <input id="qualityRange" v-model.number="qualityPct" type="range" step="1" min="10" max="100"
               :disabled="adjusting" @input="onQualityInput" @change="onQualityChange"/>
      </div>
      <button id="applyQuality" :class="{ applied }" :disabled="!canApply || adjusting" @click="apply">
        Apply
      </button>
    </div>
  </div>
</template>
