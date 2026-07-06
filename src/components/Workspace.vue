<script setup>
import { computed, ref } from 'vue'
import { ACCEPTED_EXTENSIONS, useQueue } from '@/composables/useFileQueue'
import QueuePanel from './QueuePanel.vue'
import PreviewPanel from './PreviewPanel.vue'
import SettingsPanel from './SettingsPanel.vue'

const props = defineProps({
  mode: { type: String, required: true },
})

const { addFiles, clearAll, hasFiles, showPreview } = useQueue(props.mode)

const ACCEPT = ACCEPTED_EXTENSIONS.map((ext) => '.' + ext).join(',')

function onPick(event) {
  addFiles(event.target.files)
  event.target.value = ''
}

function onDrop(event) {
  dragDepth.value = 0
  const dropped = event.dataTransfer?.files
  if (dropped && dropped.length) addFiles(dropped)
}

/* dragenter/dragleave fire for every child element, so track the depth */
const dragDepth = ref(0)
const dragging = computed(() => dragDepth.value > 0)

function onDragEnter() {
  dragDepth.value++
}

function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}
</script>

<template>
  <div class="workspace" :class="{ 'drag-over': dragging }"
       @dragover.prevent @dragenter.prevent="onDragEnter" @dragleave="onDragLeave" @drop.prevent="onDrop">
    <div class="toolbar">
      <input :id="`file-pick-${mode}`" class="visually-hidden" type="file" multiple :accept="ACCEPT" @change="onPick"/>
      <label class="btn btn-accent" :for="`file-pick-${mode}`">
        <svg viewBox="0 0 24 24" width="16" height="16"><use href="#plus"></use></svg>
        Add Files
      </label>
      <input :id="`folder-pick-${mode}`" class="visually-hidden" type="file" webkitdirectory @change="onPick"/>
      <label class="btn" :for="`folder-pick-${mode}`">
        <svg viewBox="0 0 24 24" width="16" height="16"><use href="#folder"></use></svg>
        Add Folder
      </label>
      <button class="btn" type="button" :disabled="!hasFiles" @click="clearAll">
        <svg viewBox="0 0 16 16" width="16" height="16"><use href="#clear"></use></svg>
        Clear All
      </button>
      <button class="btn" type="button" :class="{ 'btn-toggled': showPreview }"
              :title="showPreview ? 'Hide the before/after preview' : 'Show the before/after preview'"
              @click="showPreview = !showPreview">
        <svg viewBox="0 0 24 24" width="16" height="16"><use href="#eye"></use></svg>
        Preview
      </button>
    </div>

    <div class="columns" :class="{ 'no-preview': !showPreview }">
      <QueuePanel :mode="mode"/>
      <PreviewPanel v-show="showPreview" :mode="mode"/>
      <SettingsPanel :mode="mode"/>
    </div>
  </div>
</template>
