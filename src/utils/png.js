/**
 * PNG encoder with smarter compression than canvas.toBlob, and optional
 * lossy color reduction (palette quantization, like pngquant / TinyPNG).
 * Uses the browser's built-in zlib (CompressionStream), so no dependencies.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

async function zlibDeflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/** Applies the PNG filter per row that minimises the sum of absolute values (standard heuristic). */
function filterRows(raw, rowBytes, height, bpp) {
  const out = new Uint8Array((rowBytes + 1) * height)
  const candidate = new Uint8Array(rowBytes)
  const best = new Uint8Array(rowBytes)
  const zeroRow = new Uint8Array(rowBytes)
  for (let y = 0; y < height; y++) {
    const row = raw.subarray(y * rowBytes, (y + 1) * rowBytes)
    const prev = y ? raw.subarray((y - 1) * rowBytes, y * rowBytes) : zeroRow
    let bestType = 0
    let bestScore = Infinity
    for (let type = 0; type < 5; type++) {
      let score = 0
      for (let i = 0; i < rowBytes; i++) {
        const a = i >= bpp ? row[i - bpp] : 0
        const b = prev[i]
        const c = i >= bpp ? prev[i - bpp] : 0
        let v
        if (type === 0) v = row[i]
        else if (type === 1) v = row[i] - a
        else if (type === 2) v = row[i] - b
        else if (type === 3) v = row[i] - ((a + b) >> 1)
        else v = row[i] - paeth(a, b, c)
        v &= 0xff
        candidate[i] = v
        score += v < 128 ? v : 256 - v
      }
      if (score < bestScore) {
        bestScore = score
        bestType = type
        best.set(candidate)
      }
    }
    const offset = y * (rowBytes + 1)
    out[offset] = bestType
    out.set(best, offset + 1)
  }
  return out
}

/** Median-cut palette (up to maxColors) plus Floyd–Steinberg dithered indices. */
function quantize(data, width, height, maxColors) {
  const n = width * height
  let hasTransparent = false
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 0) {
      hasTransparent = true
      break
    }
  }
  const slots = Math.max(1, hasTransparent ? maxColors - 1 : maxColors)

  // sample up to ~65k visible pixels
  const step = Math.max(1, Math.floor(n / 65536))
  const samples = []
  for (let p = 0; p < n; p += step) {
    if (data[p * 4 + 3] !== 0) samples.push(p * 4)
  }

  const makeBox = (items) => {
    const min = [255, 255, 255, 255]
    const max = [0, 0, 0, 0]
    for (const i of items) {
      for (let c = 0; c < 4; c++) {
        const v = data[i + c]
        if (v < min[c]) min[c] = v
        if (v > max[c]) max[c] = v
      }
    }
    let channel = 0
    let range = -1
    for (let c = 0; c < 4; c++) {
      if (max[c] - min[c] > range) {
        range = max[c] - min[c]
        channel = c
      }
    }
    return { items, channel, score: items.length > 1 ? range * items.length : -1 }
  }

  const boxes = samples.length ? [makeBox(samples)] : []
  while (boxes.length < slots) {
    let bi = -1
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].score > 0 && (bi === -1 || boxes[i].score > boxes[bi].score)) bi = i
    }
    if (bi === -1) break
    const { items, channel } = boxes[bi]
    items.sort((a, b) => data[a + channel] - data[b + channel])
    const mid = items.length >> 1
    boxes.splice(bi, 1, makeBox(items.slice(0, mid)), makeBox(items.slice(mid)))
  }

  const palette = boxes.map(({ items }) => {
    const sum = [0, 0, 0, 0]
    for (const i of items) for (let c = 0; c < 4; c++) sum[c] += data[i + c]
    return sum.map((s) => Math.round(s / items.length))
  })
  const transparentIndex = hasTransparent ? palette.length : -1
  if (hasTransparent) palette.push([0, 0, 0, 0])

  // nearest-color lookup cached on 5-bit RGB + 3-bit alpha
  const cache = new Int16Array(1 << 18).fill(-1)
  const nearest = (r, g, b, a) => {
    const key = ((r >> 3) << 13) | ((g >> 3) << 8) | ((b >> 3) << 3) | (a >> 5)
    if (cache[key] !== -1) return cache[key]
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < palette.length; i++) {
      const p = palette[i]
      const dr = r - p[0]
      const dg = g - p[1]
      const db = b - p[2]
      const da = a - p[3]
      const dist = dr * dr + dg * dg + db * db + 2 * da * da
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    }
    cache[key] = best
    return best
  }

  const DITHER = 0.75
  const indices = new Uint8Array(n)
  let cur = new Float32Array((width + 2) * 4)
  let next = new Float32Array((width + 2) * 4)
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x
      const i = p * 4
      if (data[i + 3] === 0 && hasTransparent) {
        indices[p] = transparentIndex
        continue
      }
      const e = (x + 1) * 4
      const r = clamp(data[i] + cur[e])
      const g = clamp(data[i + 1] + cur[e + 1])
      const b = clamp(data[i + 2] + cur[e + 2])
      const a = clamp(data[i + 3] + cur[e + 3])
      const idx = nearest(r, g, b, a)
      indices[p] = idx
      const pc = palette[idx]
      const err = [r - pc[0], g - pc[1], b - pc[2], a - pc[3]]
      for (let c = 0; c < 4; c++) {
        const v = err[c] * DITHER
        cur[e + 4 + c] += (v * 7) / 16
        next[e - 4 + c] += (v * 3) / 16
        next[e + c] += (v * 5) / 16
        next[e + 4 + c] += v / 16
      }
    }
    ;[cur, next] = [next, cur]
    next.fill(0)
  }
  return { palette, indices }
}

/** Exact palette when the image has at most maxColors distinct colors, otherwise null. */
function exactPalette(data, n, maxColors) {
  const u32 = new Uint32Array(data.buffer, data.byteOffset, n)
  const map = new Map()
  const palette = []
  const indices = new Uint8Array(n)
  for (let p = 0; p < n; p++) {
    const v = u32[p]
    let idx = map.get(v)
    if (idx === undefined) {
      if (palette.length >= maxColors) return null
      idx = palette.length
      map.set(v, idx)
      const i = p * 4
      palette.push([data[i], data[i + 1], data[i + 2], data[i + 3]])
    }
    indices[p] = idx
  }
  return { palette, indices }
}

function indexedPayload(width, height, palette, indices) {
  const depth = palette.length <= 2 ? 1 : palette.length <= 4 ? 2 : palette.length <= 16 ? 4 : 8
  const rowBytes = Math.ceil((width * depth) / 8)
  const raw = new Uint8Array((rowBytes + 1) * height) // filter type 0 per row
  const perByte = 8 / depth
  for (let y = 0; y < height; y++) {
    const offset = y * (rowBytes + 1) + 1
    for (let x = 0; x < width; x++) {
      const shift = 8 - depth * ((x % perByte) + 1)
      raw[offset + Math.floor(x / perByte)] |= indices[y * width + x] << shift
    }
  }
  const plte = new Uint8Array(palette.length * 3)
  palette.forEach((p, i) => plte.set(p.slice(0, 3), i * 3))
  let lastAlpha = -1
  palette.forEach((p, i) => {
    if (p[3] !== 255) lastAlpha = i
  })
  const trns = lastAlpha >= 0 ? Uint8Array.from(palette.slice(0, lastAlpha + 1).map((p) => p[3])) : null
  return { depth, colorType: 3, raw, plte, trns }
}

/**
 * Encodes ImageData as PNG.
 * colors: 0/undefined for lossless; 2–256 to reduce to that many colors.
 */
export async function encodePng({ width, height, data }, { colors } = {}) {
  const n = width * height
  let payload
  const indexed = colors
    ? exactPalette(data, n, colors) || quantize(data, width, height, colors)
    : exactPalette(data, n, 256)

  if (indexed) {
    payload = indexedPayload(width, height, indexed.palette, indexed.indices)
  } else {
    let opaque = true
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 255) {
        opaque = false
        break
      }
    }
    const channels = opaque ? 3 : 4
    const raw = new Uint8Array(n * channels)
    if (opaque) {
      for (let p = 0, o = 0; p < n; p++) {
        raw[o++] = data[p * 4]
        raw[o++] = data[p * 4 + 1]
        raw[o++] = data[p * 4 + 2]
      }
    } else {
      raw.set(data)
    }
    payload = { depth: 8, colorType: opaque ? 2 : 6, raw: filterRows(raw, width * channels, height, channels) }
  }

  const ihdr = new Uint8Array(13)
  const view = new DataView(ihdr.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  ihdr[8] = payload.depth
  ihdr[9] = payload.colorType

  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
  ]
  if (payload.plte) parts.push(chunk('PLTE', payload.plte))
  if (payload.trns) parts.push(chunk('tRNS', payload.trns))
  parts.push(chunk('IDAT', await zlibDeflate(payload.raw)))
  parts.push(chunk('IEND', new Uint8Array(0)))
  return new Blob(parts, { type: 'image/png' })
}

/** Maps a 0–1 quality to a palette size; 1 (or none) means lossless. */
export function qualityToColors(quality) {
  if (quality == null || quality >= 1) return 0
  return Math.max(2, Math.round(256 * quality))
}
