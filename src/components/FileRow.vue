<script setup>
import { computed } from 'vue'
import { formatBytes } from '@/utils/format'

const props = defineProps({
  item: { type: Object, required: true },
  active: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'remove', 'preview'])

const savings = computed(() => {
  if (!props.item.blob || props.item.state !== 'done') return null
  return 100 - Math.round((100 * props.item.blob.size) / props.item.file.size)
})
const savingsText = computed(() => {
  if (savings.value === null) return ''
  if (savings.value > 0) return `−${savings.value}%`
  if (savings.value < 0) return `+${-savings.value}%`
  return '0%'
})

const dims = computed(() =>
  props.item.srcWidth ? `${props.item.srcWidth}×${props.item.srcHeight}` : null,
)
</script>

<template>
  <div class="file-row" :class="{ active }" @click="emit('select')">
    <div class="file-thumb" :class="{ tilesPattern: item.transparent }"
         :style="item.bg ? { backgroundColor: item.bg } : null"
         title="Toggle before/after preview" @click.stop="emit('preview')">
      <img v-if="item.thumbUrl" :src="item.thumbUrl" alt=""/>
    </div>
    <div class="file-meta">
      <p class="file-name-line">
        <span class="file-name" :title="item.file.name">{{ item.file.name }}</span>
        <span v-if="savings !== null" class="file-savings" :class="{ grew: savings < 0 }">{{ savingsText }}</span>
      </p>
      <p class="file-sub">
        <span>{{ formatBytes(item.file.size) }}</span>
        <template v-if="dims"><span class="dot">•</span><span>{{ dims }}</span></template>
      </p>
    </div>
    <div class="file-actions">
      <a v-if="item.state === 'done'" class="row-download" :href="item.url" :download="item.outName"
         title="Download this file" @click.stop>Download</a>
      <span v-else-if="item.state === 'processing'" class="row-state">
        <span class="spinner"></span>
      </span>
      <span v-else-if="item.state === 'error'" class="row-state row-error" title="Could not process this file">Error</span>
      <span v-else class="row-state row-waiting">Waiting</span>
      <button class="row-x" type="button" title="Remove from queue" @click.stop="emit('remove')">
        <svg viewBox="0 0 12 13" width="10" height="10"><use href="#close"></use></svg>
      </button>
    </div>
  </div>
</template>
