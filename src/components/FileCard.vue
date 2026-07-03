<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useFileQueue } from '@/composables/useFileQueue'
import { useCompare } from '@/composables/useCompare'
import { fitText, formatBytes } from '@/utils/format'

const props = defineProps({
  item: { type: Object, required: true },
})

const { removeFile } = useFileQueue()
const { activeItem, open } = useCompare()

const nameEl = ref(null)
const fittedName = ref('')

const displayedName = computed(() =>
  props.item.state === 'done' && props.item.outName ? props.item.outName : props.item.file.name,
)
const isActive = computed(() => activeItem.value === props.item)

function refitName() {
  fittedName.value = fitText(displayedName.value, nameEl.value)
}

onMounted(refitName)
watch(displayedName, refitName, { flush: 'post' })
</script>

<template>
  <div class="uploadedImgDiv" :class="{ activeThumb: isActive }">
    <img class="uploadedImg" :class="{ tilesPattern: item.transparent }"
         :src="item.thumbUrl || 'data:,'"
         :style="item.bg ? { backgroundColor: item.bg } : null" alt=""/>
    <header class="imgHead">
      <p ref="nameEl" class="imgName">{{ fittedName }}</p>
      <svg class="removeImgBtn" viewBox="0 0 18 18" width="18" height="18" @click="removeFile(item)">
        <use href="#remove"></use>
      </svg>
    </header>
    <div class="fileState" :state="item.state === 'done' ? 'D' : item.state === 'processing' ? 'U' : 'N'">
      <template v-if="item.state === 'waiting'">
        <svg class="fileStateIcon" viewBox="0 0 26 42" width="26" height="42">
          <use href="#waiting"></use>
        </svg>
        <p class="fileStateText">Waiting</p>
      </template>
      <template v-else-if="item.state === 'processing'">
        <svg class="fileStateIcon" viewBox="0 0 56 58" width="56" height="58">
          <use href="#processing"></use>
        </svg>
        <p class="fileStateText">Processing</p>
      </template>
      <template v-else-if="item.state === 'done'">
        <svg class="fileStateIcon" viewBox="0 0 122.877 101.052" width="35px" height="35px">
          <use href="#done"></use>
        </svg>
      </template>
      <template v-else>
        <svg class="fileStateIcon" viewBox="0 0 48 48" width="56" height="56">
          <use href="#error"></use>
        </svg>
        <p class="fileStateText">Error</p>
      </template>
    </div>
    <footer v-if="item.state !== 'error'" class="imgFooter" :class="{ imgFooterNoBG: item.state === 'done' }">
      <template v-if="item.state === 'done'">
        <a class="download" :href="item.url" :download="item.outName">DOWNLOAD</a>
        <svg class="editImgBtn" viewBox="0 0 1024 1024" @click="open(item)">
          <use href="#edit"></use>
        </svg>
      </template>
      <template v-else-if="item.state === 'processing'">
        <span class="loader"><span class="loader-inner"></span></span>
      </template>
      <template v-else>
        <div class="progressBar"></div>
        <div class="progressText">{{ formatBytes(item.file.size) }}</div>
      </template>
    </footer>
  </div>
</template>
