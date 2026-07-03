<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCompare } from '@/composables/useCompare'
import { useFileQueue } from '@/composables/useFileQueue'
import { formatBytes } from '@/utils/format'
import { encodeWebp, resizeToBlob } from '@/utils/image'

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

const bothLoaded = computed(() => orgLoaded.value && modLoaded.value)
const canApply = ref(false)

let orgSize = 0
let modSize = 0
let tempBlob = null
let sliderPos = 0.5 // fraction of the compare box width
let dragging = false

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
  qualityPct.value = Math.round(item.quality * 100)

  modUrl.value = URL.createObjectURL(item.blob)
  modSize = item.blob.size
  // Lossless resize of the source for the "Original" half of the comparison
  const orgBlob = await resizeToBlob(item.file, item.sizeFactor)
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
  applyClips()
}

function onModLoad() {
  modLoaded.value = true
  modSizeText.value = sizeLabel(modSize, true)
  if (adjusting.value) {
    adjusting.value = false
    canApply.value = true
  }
  applyClips()
}

function applyClips() {
  const box = compareDiv.value
  const org = orgImgEl.value
  const mod = modImgEl.value
  const slider = sliderEl.value
  if (!box || !org || !mod || !slider) return
  const boxW = box.offsetWidth
  const x = sliderPos * boxW
  slider.style.left = x + 'px'
  const orgEdge = org.offsetWidth / 2 - boxW / 2 + x
  org.style.clip = `rect(0,${orgEdge}px,${org.offsetHeight}px,0)`
  const modEdge = mod.offsetWidth / 2 - boxW / 2 + x
  mod.style.clip = `rect(0,${mod.offsetWidth}px,${mod.offsetHeight}px,${modEdge}px)`
}

function onSliderDown(event) {
  event.preventDefault()
  dragging = true
  sliderEl.value?.setPointerCapture?.(event.pointerId)
}

function onSliderMove(event) {
  if (!dragging) return
  const rect = compareDiv.value.getBoundingClientRect()
  sliderPos = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  applyClips()
}

function onSliderUp() {
  dragging = false
}

function onQualityInput() {
  applied.value = false
}

async function onQualityChange() {
  const item = activeItem.value
  if (!item) return
  adjusting.value = true
  canApply.value = false
  try {
    const blob = await encodeWebp(item.file, item.sizeFactor, qualityPct.value / 100)
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
  window.addEventListener('resize', applyClips)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', applyClips)
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
      <div id="compareDiv" ref="compareDiv">
        <img id="orgImg" ref="orgImgEl" class="centerImg" :src="orgUrl" alt="" @load="onOrgLoad"/>
        <img id="modImg" ref="modImgEl" class="centerImg" :src="modUrl" alt="" @load="onModLoad"/>
        <div id="slider" ref="sliderEl"
             @pointerdown="onSliderDown"
             @pointermove="onSliderMove"
             @pointerup="onSliderUp"
             @pointercancel="onSliderUp">
          <span class="sliderLeftArrow"></span><span class="sliderRightArrow"></span>
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
