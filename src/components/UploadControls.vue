<script setup>
import { useFileQueue } from '@/composables/useFileQueue'

const { addFiles, clearAll, hasFiles } = useFileQueue()

function onChange(event) {
  addFiles(event.target.files)
  event.target.value = ''
}
</script>

<template>
  <div id="uploadButtons">
    <input id="fileUpload" type="file" multiple
           accept=".apng,.png,.avif,.gif,.jpg,.jpeg,.svg,.bmp,.ico"
           @change="onChange"/>
    <label id="uploadBtn" class="btn" for="fileUpload">
      <svg viewBox="0 0 16 16" width="22" height="22">
        <use href="#browse"></use>
      </svg>
      Add Files</label>
    <button id="clearAll" class="btn" :disabled="!hasFiles" @click="clearAll">
      <svg viewBox="0 0 16 16" width="22" height="22">
        <use href="#clear"></use>
      </svg>
      Clear Queue
    </button>
  </div>
</template>
