export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, unitIndex)
  return (
    (unitIndex === 2 ? parseFloat(value.toFixed(1)) : parseInt(value)) +
    ' ' +
    ['Bytes', 'KB', 'MB'][unitIndex]
  )
}

export function replaceExtWithWebp(name) {
  return name.substring(0, name.lastIndexOf('.')) + '.webp'
}

/**
 * Middle-truncates text so it fits the element's width, keeping the last
 * 7 characters (extension) visible — same behavior as the original fitText().
 */
export function fitText(text, element) {
  if (!element) return text
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false })
  const style = window.getComputedStyle(element)
  const maxWidth = element.offsetWidth
  ctx.font =
    style.getPropertyValue('font-weight') +
    ' ' +
    style.getPropertyValue('font-size') +
    ' ' +
    style.getPropertyValue('font-family')
  if (ctx.measureText(text).width <= maxWidth) return text
  const head = text.slice(0, -7)
  const tail = text.slice(-7)
  const tailWidth = ctx.measureText(tail).width
  let headWidth = 0
  let charCount = 0
  while (headWidth + tailWidth < maxWidth) {
    charCount += 1
    headWidth = ctx.measureText(head.slice(0, charCount) + '...').width
  }
  return head.slice(0, charCount - 1) + '...' + tail
}
