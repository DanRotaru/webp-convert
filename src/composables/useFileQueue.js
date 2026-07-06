import { computed, reactive, ref, watch } from 'vue'
import { makeThumbnail, processImage } from '@/utils/image'
import { fileExt, replaceExt, replaceExtWithWebp } from '@/utils/format'
import { useErrorMessage } from './useErrorMessage'

export const ACCEPTED_EXTENSIONS = ['apng', 'png', 'avif', 'gif', 'jpg', 'jpeg', 'svg', 'webp', 'bmp', 'ico']

/** Formats the canvas encoder can write back; anything else becomes PNG in resize mode. */
const RE_ENCODABLE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

function outputPlan(fileName, mode, quality) {
  if (mode === 'convert') {
    return { type: 'image/webp', name: replaceExtWithWebp(fileName), quality }
  }
  const ext = fileExt(fileName)
  const type = RE_ENCODABLE[ext]
  if (type) return { type, name: fileName, quality: type === 'image/png' ? undefined : quality }
  return { type: 'image/png', name: replaceExt(fileName, 'png'), quality: undefined }
}

function createQueue(mode) {
  const files = ref([])
  const selected = ref(null)
  const showPreview = ref(false)
  const downloadMode = ref('zip') // 'zip' | 'files' — only relevant with more than one file
  const quality = ref(80) // percent
  // scale factor value, or 'custom' for explicit dimensions; resize mode is custom-only
  const sizeChoice = ref(mode === 'resize' ? 'custom' : '1')
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
  const totalSize = computed(() => files.value.reduce((sum, f) => sum + f.file.size, 0))
  const downloadCount = computed(() => files.value.filter((f) => f.state === 'done').length)
  const canDownloadAll = computed(
    () =>
      files.value.some((f) => f.state === 'done') &&
      files.value.every((f) => f.state === 'done' || f.state === 'error'),
  )

  function addFiles(fileList) {
    const { showInvalidFiles } = useErrorMessage()
    const invalidFiles = []
    for (const file of fileList) {
      if (ACCEPTED_EXTENSIONS.includes(fileExt(file.name))) {
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
      quality: quality.value / 100,
      resize: snapshotResize(),
      thumbUrl: null,
      transparent: false,
      bg: null,
      srcWidth: null,
      srcHeight: null,
      outWidth: null,
      outHeight: null,
    })
    files.value.push(item)
    if (!selected.value) selected.value = item
    makeThumbnail(file)
      .then(({ thumbUrl, transparent, bg, width, height }) => {
        item.thumbUrl = thumbUrl
        item.transparent = transparent
        item.bg = bg
        item.srcWidth = width
        item.srcHeight = height
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
      // Settings are read at conversion time, so a reprocess picks up changes
      item.quality = quality.value / 100
      item.resize = snapshotResize()
      const plan = outputPlan(item.file.name, mode, item.quality)
      try {
        const { blob, width, height } = await processImage(item.file, item.resize, plan.quality, plan.type)
        if (!files.value.includes(item)) continue // removed while converting
        if (item.url) URL.revokeObjectURL(item.url)
        item.blob = blob
        item.url = URL.createObjectURL(blob)
        item.outName = plan.name
        item.outWidth = width
        item.outHeight = height
        item.state = 'done'
      } catch {
        if (files.value.includes(item)) item.state = 'error'
      }
    }
    converting = false
  }

  /** Settings changed: run every finished (or failed) file through the encoder again. */
  function reprocessAll() {
    let touched = false
    for (const item of files.value) {
      if (item.state === 'done' || item.state === 'error') {
        item.state = 'waiting'
        touched = true
      }
    }
    if (touched) pump()
  }

  let reprocessTimer = null
  watch([quality, sizeChoice, customWidth, customHeight, keepAspect], () => {
    if (!hasFiles.value) return
    clearTimeout(reprocessTimer)
    reprocessTimer = setTimeout(reprocessAll, 400)
  })

  function releaseItem(item) {
    if (item.url) URL.revokeObjectURL(item.url)
  }

  function removeFile(item) {
    const index = files.value.indexOf(item)
    if (index === -1) return
    releaseItem(item)
    files.value.splice(index, 1)
    if (selected.value === item) selected.value = files.value[index] || files.value[index - 1] || null
  }

  function clearAll() {
    selected.value = null
    files.value.forEach(releaseItem)
    files.value = []
  }

  function select(item) {
    selected.value = item
  }

  function dedupeNames(names) {
    for (let i = 0; i < names.length - 1; i++) {
      let dupCount = 0
      for (let j = i + 1; j < names.length; j++) {
        if (names[i] === names[j]) {
          dupCount += 1
          const dot = names[j].lastIndexOf('.')
          names[j] = names[j].substring(0, dot) + '_' + dupCount + names[j].substring(dot)
        }
      }
    }
    return names
  }

  async function downloadAll() {
    const done = files.value.filter((f) => f.blob)
    if (done.length === 0) return
    const names = dedupeNames(done.map((f) => f.outName.replace(/.*\//g, '')))
    if (done.length === 1 || downloadMode.value !== 'zip') {
      done.forEach((f, i) => window.saveAs(f.blob, names[i]))
      return
    }
    const zip = new window.JSZip()
    done.forEach((f, i) => zip.file(names[i], f.blob))
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    window.saveAs(zipBlob, mode === 'convert' ? 'toWEBP.zip' : 'resized.zip')
  }

  return {
    mode,
    files,
    selected,
    showPreview,
    downloadMode,
    quality,
    sizeChoice,
    customWidth,
    customHeight,
    keepAspect,
    hasFiles,
    totalSize,
    downloadCount,
    canDownloadAll,
    addFiles,
    removeFile,
    clearAll,
    select,
    downloadAll,
  }
}

const queues = {
  convert: createQueue('convert'),
  resize: createQueue('resize'),
}

export function useQueue(mode) {
  return queues[mode]
}
