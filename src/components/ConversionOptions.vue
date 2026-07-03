<script setup>
import { useFileQueue } from '@/composables/useFileQueue'

const { quality, sizeChoice, customWidth, customHeight, keepAspect } = useFileQueue()

const QUALITY_OPTIONS = []
for (let pct = 100; pct >= 10; pct -= 5) {
  QUALITY_OPTIONS.push({ value: String(pct / 100), label: pct + '%' })
}

const SIZE_OPTIONS = [
  { value: '1', label: 'x1' },
  { value: '2', label: 'x2' },
  { value: '3', label: 'x3' },
  { value: '4', label: 'x4' },
  { value: '0.9', label: '0.9' },
  { value: '0.8', label: '0.8' },
  { value: '0.7', label: '0.7' },
  { value: '0.6', label: '0.6' },
  { value: '0.5', label: '0.5' },
  { value: '0.4', label: '0.4' },
  { value: '0.3', label: '0.3' },
  { value: '0.2', label: '0.2' },
  { value: '0.1', label: '0.1' },
  { value: 'custom', label: 'Custom…' },
]
</script>

<template>
  <div id="options">
    <div class="optionCont">
      <div class="selectCont">
        <label for="userQuality">Quality: </label>
        <select id="userQuality" v-model="quality" class="select">
          <option v-for="opt in QUALITY_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
    <div class="optionCont">
      <div class="selectCont">
        <label for="userSize">Size: </label>
        <select id="userSize" v-model="sizeChoice" class="select">
          <option v-for="opt in SIZE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
    <div v-if="sizeChoice === 'custom'" class="optionCont customSizeCont">
      <input v-model="customWidth" class="sizeInput" type="number" min="1" placeholder="Width"
             aria-label="Target width in pixels"/>
      <button class="aspectLock" :class="{ locked: keepAspect }" type="button"
              :title="keepAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'"
              @click="keepAspect = !keepAspect">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>
      <input v-model="customHeight" class="sizeInput" type="number" min="1" placeholder="Height"
             aria-label="Target height in pixels"/>
      <span class="sizeUnit">px</span>
    </div>
  </div>
</template>
