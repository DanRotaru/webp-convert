import { ref } from 'vue'

const HIDE_DELAY = 5000

const visible = ref(false)
const invalidFiles = ref([])
const text = ref('')
let timer = null

function scheduleHide() {
  clearTimeout(timer)
  timer = setTimeout(hide, HIDE_DELAY)
}

function showInvalidFiles(names) {
  invalidFiles.value = [...names]
  text.value = ''
  visible.value = true
  scheduleHide()
}

function showMessage(message) {
  invalidFiles.value = []
  text.value = message
  visible.value = true
  scheduleHide()
}

function hide() {
  clearTimeout(timer)
  visible.value = false
}

export function useErrorMessage() {
  return { visible, invalidFiles, text, showInvalidFiles, showMessage, hide }
}
