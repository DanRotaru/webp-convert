<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useQueue } from '@/composables/useFileQueue'
import { OUTPUT_FORMATS, SUPPORTED_FORMATS } from '@/utils/formats'
import { VECTOR_PRESETS } from '@/utils/vectorize'

const props = defineProps({
  mode: { type: String, required: true },
})

const queue = useQueue(props.mode)
const {
  quality, outputFormat, sizeChoice, customWidth, customHeight, keepAspect,
  files, selected, downloadCount, canDownloadAll, downloadAll, downloadMode,
  vectorPreset, vectorColors, vectorDetail, vectorBlur, applyVectorPreset,
} = queue

const PRESET_OPTIONS = Object.entries(VECTOR_PRESETS).map(([value, p]) => ({ value, label: p.label }))
const panelTitle = { convert: 'Conversion Settings', resize: 'Resize Settings', vectorize: 'Vectorizer Settings' }

const FORMAT_OPTIONS = [
  ...SUPPORTED_FORMATS.map((key) => ({ value: key, label: OUTPUT_FORMATS[key].label })),
  { value: 'original', label: 'Original' },
]

const currentLabel = computed(() =>
  outputFormat.value === 'original' ? 'Original' : OUTPUT_FORMATS[outputFormat.value].label,
)

const formatNote = computed(() => {
  const f = outputFormat.value
  if (f === 'original') return 'Each file keeps its format. GIF and SVG are saved as PNG.'
  let note = `JPG, PNG, GIF, SVG, BMP, ICO and AVIF are converted to ${OUTPUT_FORMATS[f].label}.`
  if (f === 'jpg') note += ' Transparent areas are filled with white.'
  if (f === 'png') note += ' Below 100% quality, colors are reduced to shrink the file; 100% is lossless.'
  if (f === 'ico') note += ' Images larger than 256×256 are scaled down to fit.'
  return note
})

// format picker dropdown, opened from the badge
const formatMenu = ref(null)
const menuOpen = ref(false)
function pickFormat(value) {
  outputFormat.value = value
  menuOpen.value = false
}
function onDocPointer(event) {
  if (menuOpen.value && !formatMenu.value?.contains(event.target)) menuOpen.value = false
}
function onDocKey(event) {
  if (event.key === 'Escape') menuOpen.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer)
  document.addEventListener('keydown', onDocKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer)
  document.removeEventListener('keydown', onDocKey)
})

// quality applies to lossy formats (PNG: color reduction); "Original" in convert mode uses it for the source format
const showQuality = computed(
  () => OUTPUT_FORMATS[outputFormat.value]?.lossy || (outputFormat.value === 'original' && props.mode === 'convert'),
)

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
      <h2>{{ panelTitle[mode] }}</h2>
    </header>

    <div v-if="mode === 'vectorize'" class="settings-body">
      <div class="setting-group">
        <p class="setting-label">Preset</p>
        <div class="chip-grid" role="radiogroup" aria-label="Vectorizer preset">
          <button v-for="opt in PRESET_OPTIONS" :key="opt.value" type="button"
                  class="chip" :class="{ active: vectorPreset === opt.value }"
                  role="radio" :aria-checked="vectorPreset === opt.value"
                  @click="applyVectorPreset(opt.value)">{{ opt.label }}</button>
        </div>
      </div>

      <div class="setting-group">
        <div class="setting-label-row">
          <p class="setting-label"><label for="vector-colors">Colors</label></p>
          <span class="setting-value">{{ vectorColors }}</span>
        </div>
        <input id="vector-colors" v-model.number="vectorColors" class="range" type="range" min="2" max="64" step="1"/>
      </div>

      <div class="setting-group">
        <div class="setting-label-row">
          <p class="setting-label"><label for="vector-detail">Ignore specks under</label></p>
          <span class="setting-value">{{ vectorDetail }} px</span>
        </div>
        <input id="vector-detail" v-model.number="vectorDetail" class="range" type="range" min="0" max="64" step="1"/>
      </div>

      <div class="setting-group">
        <div class="setting-label-row">
          <p class="setting-label"><label for="vector-blur">Smoothing</label></p>
          <span class="setting-value">{{ vectorBlur }}</span>
        </div>
        <input id="vector-blur" v-model.number="vectorBlur" class="range" type="range" min="0" max="5" step="1"/>
      </div>

      <p class="setting-hint">Fewer colors and more speck removal give smaller, cleaner SVGs. Works best on logos, icons and flat artwork.</p>
      <p class="setting-hint reprocess-hint">Changes re-process the whole queue automatically.</p>
    </div>

    <div v-else class="settings-body">
      <div class="setting-group">
        <p class="setting-label">Output format</p>
        <div class="format-note">
          <div ref="formatMenu" class="format-picker">
            <button type="button" class="format-chip" aria-haspopup="listbox" :aria-expanded="menuOpen"
                    title="Change output format" @click="menuOpen = !menuOpen">
              {{ currentLabel }}
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor"
                   stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <ul v-if="menuOpen" class="format-menu" role="listbox" aria-label="Output format">
              <li v-for="opt in FORMAT_OPTIONS" :key="opt.value" role="option"
                  :aria-selected="outputFormat === opt.value">
                <button type="button" :class="{ active: outputFormat === opt.value }"
                        @click="pickFormat(opt.value)">{{ opt.label }}</button>
              </li>
            </ul>
          </div>
          <p>{{ formatNote }}</p>
        </div>
      </div>

      <div v-if="showQuality" class="setting-group">
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
