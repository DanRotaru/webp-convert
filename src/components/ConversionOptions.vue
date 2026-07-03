<script setup>
import { useFileQueue } from '@/composables/useFileQueue'

const { quality, sizeFactor } = useFileQueue()

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
        <select id="userSize" v-model="sizeFactor" class="select">
          <option v-for="opt in SIZE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
  </div>
</template>
