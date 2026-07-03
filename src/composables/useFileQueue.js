import { computed, reactive, ref } from 'vue'
import { encodeWebp, makeThumbnail } from '@/utils/image'
import { replaceExtWithWebp } from '@/utils/format'
import { useErrorMessage } from './useErrorMessage'
import { useCompare } from './useCompare'

export const ACCEPTED_EXTENSIONS = ['apng', 'png', 'avif', 'gif', 'jpg', 'jpeg', 'svg', 'webp', 'bmp', 'ico']

const files = ref([])
const quality = ref('0.8')
const sizeChoice = ref('1') // scale factor value, or 'custom' for explicit dimensions
const customWidth = ref('')
const customHeight = ref('')
const keepAspect = ref(true)
let nextId = 0
let converting = false

function snapshotResize() {
  if (sizeChoice.value === 'custom') {
    return {
      mode: 'custom',
      width: parseInt(customWidth.value, 10) || null,
      height: parseInt(customHeight.value, 10) || null,
      keepAspect: keepAspect.value,
    }
  }
  return { mode: 'scale', factor: parseFloat(sizeChoice.value) }
}

const hasFiles = computed(() => files.value.length > 0)
const downloadCount = computed(() => files.value.filter((f) => f.outName !== null).length)
const canDownloadAll = computed(
  () =>
    files.value.some((f) => f.state === 'done') &&
    files.value.every((f) => f.state === 'done' || f.state === 'error'),
)

function addFiles(fileList) {
  document.getElementById('WEBP-Converter')?.scrollIntoView({ behavior: 'smooth' })
  const { showInvalidFiles } = useErrorMessage()
  const invalidFiles = []
  for (const file of fileList) {
    const ext = file.name.toLowerCase().split('.').pop()
    if (ACCEPTED_EXTENSIONS.includes(ext)) {
      addFile(file)
    } else {
      invalidFiles.push(file.name)
    }
  }
  if (invalidFiles.length > 0) showInvalidFiles(invalidFiles)
}

function addFile(file) {
  const item = reactive({
    id: nextId++,
    file,
    state: 'waiting', // waiting | processing | done | error
    outName: null,
    blob: null,
    url: null,
    quality: parseFloat(quality.value),
    resize: snapshotResize(),
    thumbUrl: null,
    transparent: false,
    bg: null,
  })
  files.value.push(item)
  makeThumbnail(file)
    .then(({ thumbUrl, transparent, bg }) => {
      item.thumbUrl = thumbUrl
      item.transparent = transparent
      item.bg = bg
    })
    .catch(() => {})
  pump()
}

async function pump() {
  if (converting) return
  converting = true
  let item
  while ((item = files.value.find((f) => f.state === 'waiting'))) {
    item.state = 'processing'
    // Quality and size are read at conversion time, like the original selects
    item.quality = parseFloat(quality.value)
    item.resize = snapshotResize()
    try {
      const blob = await encodeWebp(item.file, item.resize, item.quality)
      if (!files.value.includes(item)) continue // removed while converting
      item.blob = blob
      item.url = URL.createObjectURL(blob)
      item.outName = replaceExtWithWebp(item.file.name)
      item.state = 'done'
    } catch {
      if (files.value.includes(item)) item.state = 'error'
    }
  }
  converting = false
}

/** Re-points an item at a new blob (used by the quality compare "Apply"). */
function updateBlob(item, blob, itemQuality) {
  if (item.url) URL.revokeObjectURL(item.url)
  item.blob = blob
  item.url = URL.createObjectURL(blob)
  item.quality = itemQuality
}

function releaseItem(item) {
  if (item.url) URL.revokeObjectURL(item.url)
}

function removeFile(item) {
  const { activeItem, close } = useCompare()
  const index = files.value.indexOf(item)
  if (index === -1) return
  if (activeItem.value === item) close()
  releaseItem(item)
  files.value.splice(index, 1)
}

function clearAll() {
  const { close } = useCompare()
  close()
  files.value.forEach(releaseItem)
  files.value = []
}

function dedupeNames(names) {
  for (let i = 0; i < names.length - 1; i++) {
    let dupCount = 0
    for (let j = i + 1; j < names.length; j++) {
      if (names[i] === names[j]) {
        dupCount += 1
        names[j] = names[j].replace('.webp', '') + '_' + dupCount + '.webp'
      }
    }
  }
  return names
}

async function downloadAll() {
  const done = files.value.filter((f) => f.blob)
  if (done.length === 0) return
  const zip = new window.JSZip()
  const names = dedupeNames(done.map((f) => f.outName.replace(/.*\//g, '')))
  done.forEach((f, i) => zip.file(names[i], f.blob))
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  window.saveAs(zipBlob, 'toWEBP.zip')
}

export function useFileQueue() {
  return {
    files,
    quality,
    sizeChoice,
    customWidth,
    customHeight,
    keepAspect,
    hasFiles,
    downloadCount,
    canDownloadAll,
    addFiles,
    removeFile,
    clearAll,
    downloadAll,
    updateBlob,
  }
}
