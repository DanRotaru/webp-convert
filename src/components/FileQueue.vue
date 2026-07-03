<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useFileQueue } from '@/composables/useFileQueue'
import FileCard from './FileCard.vue'

const { files, hasFiles, addFiles } = useFileQueue()

const scroller = ref(null)
const canPrev = ref(false)
const canNext = ref(false)

function updateScrollState() {
  const el = scroller.value
  if (!el) return
  canPrev.value = el.scrollLeft > 0
  canNext.value = el.scrollLeft < el.scrollWidth - el.offsetWidth
}

function scrollPage(direction) {
  const el = scroller.value
  if (!el) return
  el.scrollBy({ left: direction * (el.offsetWidth - 94), behavior: 'smooth' })
}

// New files scroll the strip to the end, like the original scrollFiles(Infinity)
watch(
  () => files.value.length,
  (length, prevLength) => {
    if (length > prevLength) {
      nextTick(() => scroller.value?.scrollTo({ left: scroller.value.scrollWidth, behavior: 'smooth' }))
    }
    nextTick(updateScrollState)
  },
)

function onDrop(event) {
  const dropped = event.dataTransfer?.files
  if (dropped && dropped.length) {
    event.preventDefault()
    event.stopPropagation()
    addFiles(dropped)
  }
}

onMounted(() => {
  updateScrollState()
  window.addEventListener('resize', updateScrollState)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateScrollState))
</script>

<template>
  <div id="files" :class="{ grayBorder: hasFiles }">
    <div class="prevBtn" :class="{ disabled: !canPrev }" @click="scrollPage(-1)">
      <svg class="scrollArrow scrollArrowLeft" viewBox="0 0 8 16" width="8" height="16">
        <use href="#arrow-right"></use>
      </svg>
    </div>
    <div id="filesScroll" ref="scroller"
         @scroll.passive="updateScrollState"
         @dragover.prevent.stop
         @dragenter.prevent.stop
         @drop="onDrop">
      <p v-show="!hasFiles" id="dropFilesPlaceHolder">Drop Your Files Here</p>
      <div id="filesList" :class="{ filesListBorder: !hasFiles }">
        <FileCard v-for="item in files" :key="item.id" :item="item"/>
      </div>
    </div>
    <div class="nextBtn" :class="{ disabled: !canNext }" @click="scrollPage(1)">
      <svg class="scrollArrow" viewBox="0 0 8 16" width="8" height="16">
        <use href="#arrow-right"></use>
      </svg>
    </div>
  </div>
</template>
