/**
 * Encoders for formats the canvas can't write natively (BMP, ICO).
 */

/** 32-bit BMP with alpha (BITMAPV4HEADER + BI_BITFIELDS), top-down rows. */
export function encodeBmp(canvas) {
  const { width, height } = canvas
  const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data
  const FILE_HEADER = 14
  const INFO_HEADER = 108
  const offset = FILE_HEADER + INFO_HEADER
  const imageSize = width * height * 4
  const buf = new ArrayBuffer(offset + imageSize)
  const v = new DataView(buf)

  // BITMAPFILEHEADER
  v.setUint8(0, 0x42) // 'B'
  v.setUint8(1, 0x4d) // 'M'
  v.setUint32(2, buf.byteLength, true)
  v.setUint32(10, offset, true)

  // BITMAPV4HEADER
  v.setUint32(14, INFO_HEADER, true)
  v.setInt32(18, width, true)
  v.setInt32(22, -height, true) // negative height = top-down
  v.setUint16(26, 1, true) // planes
  v.setUint16(28, 32, true) // bits per pixel
  v.setUint32(30, 3, true) // BI_BITFIELDS
  v.setUint32(34, imageSize, true)
  v.setInt32(38, 2835, true) // 72 DPI
  v.setInt32(42, 2835, true)
  v.setUint32(54, 0x00ff0000, true) // red mask
  v.setUint32(58, 0x0000ff00, true) // green mask
  v.setUint32(62, 0x000000ff, true) // blue mask
  v.setUint32(66, 0xff000000, true) // alpha mask
  v.setUint32(70, 0x73524742, true) // 'sRGB' color space

  // pixel data: RGBA -> BGRA
  const out = new Uint8Array(buf, offset)
  for (let i = 0; i < pixels.length; i += 4) {
    out[i] = pixels[i + 2]
    out[i + 1] = pixels[i + 1]
    out[i + 2] = pixels[i]
    out[i + 3] = pixels[i + 3]
  }
  return new Blob([buf], { type: 'image/bmp' })
}

/** Single-image ICO wrapping a PNG (supported since Windows Vista). Max 256x256. */
export async function encodeIco(pngBlob, width, height) {
  const png = new Uint8Array(await pngBlob.arrayBuffer())
  const HEADER = 6
  const ENTRY = 16
  const buf = new ArrayBuffer(HEADER + ENTRY + png.length)
  const v = new DataView(buf)

  // ICONDIR
  v.setUint16(2, 1, true) // type: icon
  v.setUint16(4, 1, true) // image count

  // ICONDIRENTRY (0 means 256)
  v.setUint8(6, width >= 256 ? 0 : width)
  v.setUint8(7, height >= 256 ? 0 : height)
  v.setUint16(10, 1, true) // color planes
  v.setUint16(12, 32, true) // bits per pixel
  v.setUint32(14, png.length, true)
  v.setUint32(18, HEADER + ENTRY, true)

  new Uint8Array(buf, HEADER + ENTRY).set(png)
  return new Blob([buf], { type: 'image/x-icon' })
}
