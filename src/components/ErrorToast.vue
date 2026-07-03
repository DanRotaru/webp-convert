<script setup>
import { useErrorMessage } from '@/composables/useErrorMessage'

const { visible, invalidFiles, text, hide } = useErrorMessage()
</script>

<template>
  <div id="errMsg" :style="{ top: visible ? '20px' : '-1000px' }">
    <svg id="closeErrMsg" class="close" viewBox="0 0 12 13" width="14" height="14" @click="hide">
      <use href="#close"></use>
    </svg>
    <span id="msgTxt">
      <template v-if="invalidFiles.length > 1">
        <strong>Invalid files format:</strong>
        <ul class="msgUL">
          <li v-for="name in invalidFiles" :key="name">- {{ name }}</li>
        </ul>
      </template>
      <template v-else-if="invalidFiles.length === 1">
        <strong>Invalid file format:</strong><br/>
        <span class="msgSpan">- {{ invalidFiles[0] }}</span>
      </template>
      <template v-else>{{ text }}</template>
    </span>
  </div>
</template>
