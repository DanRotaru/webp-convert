import { loadImage } from './image'

/** Longest edge traced; bigger images are downscaled first (tracing cost grows fast with pixels), then scaled back up in the SVG. */
const MAX_TRACE_EDGE = 1600

/**
 * Presets exposed in the UI. Each one seeds the sliders (colors, detail, blur)
 * and carries extra imagetracerjs options the sliders don't cover.
 */
export const VECTOR_PRESETS = {
  default: { label: 'Default', colors: 16, pathomit: 8, blur: 0, extra: {} },
  detailed: { label: 'Detailed', colors: 64, pathomit: 0, blur: 0, extra: { ltres: 0.5, qtres: 0.5, roundcoords: 2 } },
  smooth: { label: 'Smooth', colors: 16, pathomit: 8, blur: 5, extra: { blurdelta: 64 } },
  curvy: { label: 'Curvy', colors: 16, pathomit: 8, blur: 0, extra: { ltres: 0.01, linefilter: true, rightangleenhance: false } },
  sharp: { label: 'Sharp', colors: 16, pathomit: 8, blur: 0, extra: { qtres: 0.01 } },
  posterized: { label: 'Posterized', colors: 4, pathomit: 8, blur: 5, extra: {} },
  grayscale: { label: 'Grayscale', colors: 7, pathomit: 8, blur: 0, extra: { colorsampling: 0, colorquantcycles: 1 } },
  bw: { label: 'Black & White', colors: 2, pathomit: 8, blur: 0, extra: { colorsampling: 0 } },
}

let worker = null
let nextJob = 0
const jobs = new Map()

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('../workers/vectorize.worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    const job = jobs.get(data.id)
    if (!job) return
    jobs.delete(data.id)
    if (data.error) job.reject(new Error(data.error))
    else job.resolve(data.svg)
  }
  worker.onerror = (event) => {
    for (const job of jobs.values()) job.reject(new Error(event.message || 'Vectorizer crashed'))
    jobs.clear()
    worker.terminate()
    worker = null
  }
  return worker
}

function trace(imageData, options) {
  return new Promise((resolve, reject) => {
    const id = nextJob++
    jobs.set(id, { resolve, reject })
    getWorker().postMessage({ id, imageData, options }, [imageData.data.buffer])
  })
}

/**
 * Traces a raster image into an SVG.
 * settings: { preset, colors, pathomit, blur }
 * Returns { blob, width, height } — the SVG keeps the source pixel dimensions.
 */
export async function vectorizeImage(file, settings) {
  const url = URL.createObjectURL(file)
  let img
  try {
    img = await loadImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height
  const shrink = Math.min(1, MAX_TRACE_EDGE / Math.max(srcW, srcH))
  const w = Math.max(1, Math.round(srcW * shrink))
  const h = Math.max(1, Math.round(srcH * shrink))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)

  const preset = VECTOR_PRESETS[settings.preset] || VECTOR_PRESETS.default
  const options = {
    ...preset.extra,
    numberofcolors: settings.colors,
    pathomit: settings.pathomit,
    blurradius: settings.blur,
    scale: 1 / shrink,
    viewbox: true,
  }
  let svg = await trace(imageData, options)
  // viewbox mode drops width/height; put the source dimensions back so the file opens at its real size
  svg = svg.replace('<svg ', `<svg width="${srcW}" height="${srcH}" `)
  return { blob: new Blob([svg], { type: 'image/svg+xml' }), width: srcW, height: srcH }
}
