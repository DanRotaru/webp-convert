import { ref, watch } from 'vue'

export const VIEWS = {
  convert: {
    title: 'WebP Converter',
    subtitle: 'Batch convert JPG, PNG, GIF, SVG, BMP, ICO and AVIF to WebP. Free, private, in your browser.',
    icon: 'bolt',
    label: 'WebP Converter',
  },
  resize: {
    title: 'Bulk Resize',
    subtitle: 'Resize many images at once, each file keeps its original format.',
    icon: 'resize',
    label: 'Resize',
  },
}

export const QUEUE_LAYOUTS = [
  { key: 'cards', icon: 'view-grid', label: 'Cards' },
  { key: 'list', icon: 'view-list', label: 'List' },
  { key: 'details', icon: 'view-details', label: 'Details' },
]

const activeView = ref('convert')

const queueLayout = ref('cards')
try {
  const stored = localStorage.getItem('webp-queue-layout')
  if (QUEUE_LAYOUTS.some((l) => l.key === stored)) queueLayout.value = stored
} catch {
  /* private mode */
}
watch(queueLayout, (value) => {
  try {
    localStorage.setItem('webp-queue-layout', value)
  } catch {
    /* private mode */
  }
})

export function useView() {
  return { activeView, VIEWS, queueLayout, QUEUE_LAYOUTS }
}
