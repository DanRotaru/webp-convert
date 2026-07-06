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

export function replaceExt(name, ext) {
  const dot = name.lastIndexOf('.')
  return (dot === -1 ? name : name.substring(0, dot)) + '.' + ext
}

export function replaceExtWithWebp(name) {
  return replaceExt(name, 'webp')
}

export function fileExt(name) {
  return name.toLowerCase().split('.').pop()
}
