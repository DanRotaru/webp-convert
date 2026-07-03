import { ref } from 'vue'

const activeItem = ref(null)

function open(item) {
  activeItem.value = item
}

function close() {
  if (!activeItem.value) return
  activeItem.value = null
  document.getElementById('WEBP-Converter')?.scrollIntoView({ behavior: 'smooth' })
}

export function useCompare() {
  return { activeItem, open, close }
}
