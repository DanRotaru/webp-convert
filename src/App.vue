<script setup>
import SvgSprite from '@/components/SvgSprite.vue'
import ErrorToast from '@/components/ErrorToast.vue'
import UploadControls from '@/components/UploadControls.vue'
import ConversionOptions from '@/components/ConversionOptions.vue'
import FileQueue from '@/components/FileQueue.vue'
import CompareSlider from '@/components/CompareSlider.vue'
import { useFileQueue } from '@/composables/useFileQueue'
import { useCompare } from '@/composables/useCompare'

const { downloadCount, canDownloadAll, downloadAll } = useFileQueue()
const { activeItem } = useCompare()
</script>

<template>
  <SvgSprite/>
  <main role="main">
    <div id="page">
      <ErrorToast/>
      <div id="content">
        <h1><span id="h1Span">Free Bulk Images to WebP Converter Online</span></h1>
        <div id="headerText">Batch convert JPG, PNG, GIF, SVG, ICO, BMP, and AVIF to WebP. <strong>100% free,
          instant</strong>, unlimited &amp; directly online in your browser.<br><strong>No Uploads—Files Stay
          Private!</strong></div>
      </div>
      <div id="WEBP-Converter">
        <UploadControls/>
        <ConversionOptions/>
        <FileQueue/>
        <div id="downloadAllCont">
          <button id="downloadAll" class="btn" :disabled="!canDownloadAll" @click="downloadAll">
            <svg viewBox="0 0 16 16" width="22" height="22">
              <use href="#download"></use>
            </svg>
            Download All<span id="downloadCount">{{ downloadCount }}</span></button>
        </div>
      </div>
      <CompareSlider v-if="activeItem"/>
    </div>
  </main>
</template>
