<script setup>
import { computed } from 'vue'
import { useQueue } from '@/composables/useFileQueue'

const props = defineProps({
  mode: { type: String, required: true },
})

const queue = useQueue(props.mode)
const {
  quality, sizeChoice, customWidth, customHeight, keepAspect,
  files, selected, downloadCount, canDownloadAll, downloadAll, downloadMode,
} = queue

const SCALE_OPTIONS = [
  { value: '1', label: '1×' },
  { value: 'custom', label: 'Custom' },
]

const downloadHint = computed(() => {
  if (files.value.length === 0) return 'Add files to get started'
  if (!canDownloadAll.value) return `${downloadCount.value} of ${files.value.length} ready…`
  return downloadCount.value === 1 ? '1 file ready' : `${downloadCount.value} files ready`
})

/* Aspect ratio of the selected image (falls back to the first loaded one),
   used to mirror width <-> height while the ratio is locked. */
const aspect = computed(() => {
  const source =
    (selected.value?.srcWidth && selected.value) || files.value.find((f) => f.srcWidth) || null
  return source ? source.srcWidth / source.srcHeight : null
})

function heightFromWidth(width) {
  const n = parseInt(width, 10)
  return n > 0 && aspect.value ? String(Math.max(1, Math.round(n / aspect.value))) : ''
}

function onWidthInput(event) {
  customWidth.value = event.target.value
  if (keepAspect.value && aspect.value) customHeight.value = heightFromWidth(event.target.value)
}

function onHeightInput(event) {
  customHeight.value = event.target.value
  if (keepAspect.value && aspect.value) {
    const n = parseInt(event.target.value, 10)
    customWidth.value = n > 0 ? String(Math.max(1, Math.round(n * aspect.value))) : ''
  }
}

function toggleAspect() {
  keepAspect.value = !keepAspect.value
  if (keepAspect.value && customWidth.value) customHeight.value = heightFromWidth(customWidth.value)
}
</script>

<template>
  <aside class="panel settings-panel">
    <header class="panel-head">
      <h2>{{ mode === 'convert' ? 'Conversion Settings' : 'Resize Settings' }}</h2>
    </header>

    <div class="settings-body">
      <div class="setting-group">
        <p class="setting-label">Output format</p>
        <div v-if="mode === 'convert'" class="format-note">
          <span class="format-chip">WebP</span>
          <p>JPG, PNG, GIF, SVG, BMP, ICO and AVIF are converted to WebP.</p>
        </div>
        <div v-else class="format-note">
          <span class="format-chip">Original</span>
          <p>Each file keeps its format. GIF, SVG, BMP and ICO are saved as PNG.</p>
        </div>
      </div>

      <div v-if="mode === 'convert'" class="setting-group">
        <div class="setting-label-row">
          <p class="setting-label"><label for="quality">Quality</label></p>
          <span class="setting-value">{{ quality }}%</span>
        </div>
        <input id="quality" v-model.number="quality" class="range" type="range" min="10" max="100" step="1"/>
      </div>

      <div class="setting-group">
        <p class="setting-label">Size</p>
        <div v-if="mode === 'convert'" class="chip-grid" role="radiogroup" aria-label="Output size">
          <button v-for="opt in SCALE_OPTIONS" :key="opt.value" type="button"
                  class="chip" :class="{ active: sizeChoice === opt.value }"
                  role="radio" :aria-checked="sizeChoice === opt.value"
                  @click="sizeChoice = opt.value">{{ opt.label }}</button>
        </div>
        <div v-if="sizeChoice === 'custom'" class="custom-size">
          <input :value="customWidth" class="size-input" type="number" min="1" placeholder="Width"
                 aria-label="Target width in pixels" @input="onWidthInput"/>
          <button class="aspect-lock" :class="{ locked: keepAspect }" type="button"
                  :title="keepAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'"
                  @click="toggleAspect">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <input :value="customHeight" class="size-input" type="number" min="1" placeholder="Height"
                 aria-label="Target height in pixels" @input="onHeightInput"/>
          <span class="size-unit">px</span>
        </div>
        <p v-if="mode === 'resize'" class="setting-hint">Leave empty to keep the original dimensions.</p>
      </div>

      <p class="setting-hint reprocess-hint">Changes re-process the whole queue automatically.</p>
    </div>

    <div class="settings-foot">
      <div v-if="files.length > 1" class="dl-mode" role="radiogroup" aria-label="Download as">
        <label class="dl-mode-option">
          <input v-model="downloadMode" type="radio" value="zip"/>
          ZIP archive
        </label>
        <label class="dl-mode-option">
          <input v-model="downloadMode" type="radio" value="files"/>
          Separate files
        </label>
      </div>
      <button class="btn btn-accent btn-download" :disabled="!canDownloadAll" @click="downloadAll">
        <svg viewBox="0 0 16 16" width="16" height="16"><use href="#download"></use></svg>
        {{ files.length === 1 ? 'Download' : 'Download All' }}
        <span v-if="downloadCount > 1" class="count-badge">{{ downloadCount }}</span>
      </button>
      <p class="download-hint">{{ downloadHint }}</p>
    </div>
  </aside>
</template>
