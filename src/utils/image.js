const THUMB_SIZE = 300
const TRANSPARENCY_SAMPLE = 100

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error('Image failed to load')))
    img.src = src
  })
}

export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function loadImageFromFile(file) {
  const url = URL.createObjectURL(file)
  try {
    return await loadImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Resolves the output dimensions for a resize descriptor:
 * { mode: 'scale', factor } or { mode: 'custom', width, height, keepAspect }.
 * With keepAspect, a single dimension drives the other; both dimensions fit
 * the image inside the box ("contain").
 */
export function computeTargetSize(img, resize) {
  const w0 = img.width
  const h0 = img.height
  let w = w0
  let h = h0
  if (!resize || resize.mode === 'scale') {
    const factor = resize?.factor ?? 1
    w = w0 * factor
    h = h0 * factor
  } else if (resize.width || resize.height) {
    const { width, height, keepAspect } = resize
    if (keepAspect) {
      if (width && height) {
        const s = Math.min(width / w0, height / h0)
        w = w0 * s
        h = h0 * s
      } else if (width) {
        w = width
        h = (width * h0) / w0
      } else {
        h = height
        w = (height * w0) / h0
      }
    } else {
      w = width || w0
      h = height || h0
    }
  }
  return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) }
}

function drawResized(img, resize) {
  const { width, height } = computeTargetSize(img, resize)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height)
  return canvas
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas encoding failed'))),
      type,
      quality,
    )
  })
}

/**
 * Resizes the image per the resize descriptor and encodes it to the given
 * mime type. Returns the blob and the output pixel dimensions.
 */
export async function processImage(file, resize, quality, type = 'image/webp') {
  const img = await loadImageFromFile(file)
  const canvas = drawResized(img, resize)
  const blob = await canvasToBlob(canvas, type, quality)
  return { blob, width: canvas.width, height: canvas.height }
}

/** Resizes the image per the resize descriptor and encodes it losslessly (PNG) for the compare preview. */
export async function resizeToBlob(file, resize) {
  const img = await loadImageFromFile(file)
  return canvasToBlob(drawResized(img, resize))
}

function isTransparent(ctx, size) {
  const data = ctx.getImageData(0, 0, size, size).data
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true
  }
  return false
}

function getAverageRGB(img) {
  const defaultRgb = { r: 255, g: 255, b: 255 }
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext && canvas.getContext('2d')
  if (!ctx) return defaultRgb
  canvas.height = img.naturalHeight || img.height
  canvas.width = img.naturalWidth || img.width
  ctx.drawImage(img, 0, 0)
  let imageData
  try {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  } catch {
    return defaultRgb
  }
  const rgb = { r: 0, g: 0, b: 0 }
  let count = 0
  for (let i = -4; (i += 20) < imageData.data.length; ) {
    count++
    rgb.r += imageData.data[i]
    rgb.g += imageData.data[i + 1]
    rgb.b += imageData.data[i + 2]
  }
  rgb.r = ~~(rgb.r / count)
  rgb.g = ~~(rgb.g / count)
  rgb.b = ~~(rgb.b / count)
  return rgb
}

/**
 * Builds a 150x150 "contain" thumbnail. PNG/GIF sources are probed for
 * transparency (checker pattern background); opaque images get their average
 * color as background — same as the original.
 */
export async function makeThumbnail(file) {
  const img = await loadImage(await readAsDataURL(file))
  const canvas = document.createElement('canvas')
  canvas.width = THUMB_SIZE
  canvas.height = THUMB_SIZE
  const ctx = canvas.getContext('2d')
  const scale = Math.min(THUMB_SIZE / img.width, THUMB_SIZE / img.height)
  const drawWidth = img.width * scale
  const drawHeight = img.height * scale
  ctx.drawImage(img, (THUMB_SIZE - drawWidth) / 2, (THUMB_SIZE - drawHeight) / 2, drawWidth, drawHeight)
  const thumbUrl = canvas.toDataURL()

  const ext = file.name.split('.').pop().toLowerCase()
  let transparent = false
  if (ext === 'gif' || ext === 'png') {
    ctx.drawImage(img, 0, 0, TRANSPARENCY_SAMPLE, TRANSPARENCY_SAMPLE)
    transparent = isTransparent(ctx, TRANSPARENCY_SAMPLE)
  }
  let bg = null
  if (!transparent) {
    const { r, g, b } = getAverageRGB(img)
    bg = `rgb(${r},${g},${b})`
  }
  return {
    thumbUrl,
    transparent,
    bg,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  }
}
