import { fileExt, replaceExt } from './format'

/**
 * Output formats the app can write.
 * lossy: honours the quality slider (PNG uses it for color reduction). opaque: no alpha channel, so transparency is flattened onto white.
 * maxSize: largest edge the format allows.
 */
export const OUTPUT_FORMATS = {
  webp: { label: 'WebP', ext: 'webp', mime: 'image/webp', lossy: true },
  png: { label: 'PNG', ext: 'png', mime: 'image/png', lossy: true },
  jpg: { label: 'JPG', ext: 'jpg', mime: 'image/jpeg', lossy: true, opaque: true },
  avif: { label: 'AVIF', ext: 'avif', mime: 'image/avif', lossy: true },
  bmp: { label: 'BMP', ext: 'bmp', mime: 'image/bmp' },
  ico: { label: 'ICO', ext: 'ico', mime: 'image/x-icon', maxSize: 256 },
}

/** The browser silently falls back to PNG for mime types it can't encode, so probe for it. */
function canEncode(mime) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    return canvas.toDataURL(mime).startsWith(`data:${mime}`)
  } catch {
    return false
  }
}

export const SUPPORTED_FORMATS = Object.keys(OUTPUT_FORMATS).filter(
  (key) => key !== 'avif' || canEncode(OUTPUT_FORMATS.avif.mime),
)

/** Source extension -> output format used by the "Original" option. */
const ORIGINAL_FORMAT = {
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  bmp: 'bmp',
  ico: 'ico',
}

/** Output format matching the source file's own format, or null when it can't be written back. */
export function sourceFormat(fileName) {
  const key = ORIGINAL_FORMAT[fileExt(fileName)]
  return key && SUPPORTED_FORMATS.includes(key) ? key : null
}

/**
 * Resolves the format key and output file name for a source file.
 * choice is a key of OUTPUT_FORMATS or 'original'.
 */
export function resolveOutput(fileName, choice) {
  if (choice === 'original') {
    const key = sourceFormat(fileName)
    // keep the exact original name (e.g. .jpeg) when the format can be written back
    if (key) return { format: key, name: fileName }
    return { format: 'png', name: replaceExt(fileName, 'png') }
  }
  return { format: choice, name: replaceExt(fileName, OUTPUT_FORMATS[choice].ext) }
}
