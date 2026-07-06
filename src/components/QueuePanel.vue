<script setup>
import { computed } from 'vue'
import { useQueue } from '@/composables/useFileQueue'
import { useView } from '@/composables/useView'
import { formatBytes } from '@/utils/format'
import FileRow from './FileRow.vue'

const props = defineProps({
  mode: { type: String, required: true },
})

const queue = useQueue(props.mode)
const { files, selected, hasFiles, totalSize, select, removeFile, showPreview } = queue
const { queueLayout, QUEUE_LAYOUTS } = useView()

const countLabel = computed(() =>
  files.value.length === 1 ? '1 File Added' : `${files.value.length} Files Added`,
)

function savingsOf(item) {
  if (!item.blob || item.state !== 'done') return null
  return 100 - Math.round((100 * item.blob.size) / item.file.size)
}

function savingsText(item) {
  const pct = savingsOf(item)
  if (pct === null) return ''
  if (pct > 0) return `−${pct}%`
  if (pct < 0) return `+${-pct}%`
  return '0%'
}

function dimsOf(item) {
  return item.srcWidth ? `${item.srcWidth}×${item.srcHeight}` : '…'
}

/** Clicking a file's image opens it in the before/after preview. If the
    preview already shows that same file, the click hides the preview instead. */
function onImageClick(item) {
  const sameAgain = showPreview.value && selected.value === item
  select(item)
  showPreview.value = !sameAgain
}
</script>

<template>
  <section class="panel queue-panel">
    <header class="panel-head">
      <h2>{{ hasFiles ? countLabel : 'Queue' }}</h2>
      <div class="queue-head-right">
        <span v-if="hasFiles" class="panel-head-sub">Total: {{ formatBytes(totalSize) }}</span>
        <div class="layout-switch" role="radiogroup" aria-label="Queue layout">
          <button v-for="layout in QUEUE_LAYOUTS" :key="layout.key" type="button"
                  class="layout-btn" :class="{ active: queueLayout === layout.key }"
                  role="radio" :aria-checked="queueLayout === layout.key"
                  :title="layout.label" @click="queueLayout = layout.key">
            <svg viewBox="0 0 24 24" width="15" height="15"><use :href="'#' + layout.icon"></use></svg>
          </button>
        </div>
      </div>
    </header>

    <!-- empty state -->
    <div v-if="!hasFiles" class="file-list">
      <div class="queue-empty">
        <svg viewBox="0 0 24 24" width="28" height="28"><use href="#image"></use></svg>
        <p>Drop images here<br/>or use <label class="add-link" :for="`file-pick-${mode}`">Add Files</label></p>
      </div>
    </div>

    <!-- cards -->
    <div v-else-if="queueLayout === 'cards'" class="file-cards" role="list">
      <div v-for="item in files" :key="item.id" role="listitem"
           class="file-card" :class="{ active: selected === item }"
           title="Open before/after preview" @click="onImageClick(item)">
        <div class="card-thumb" :class="{ tilesPattern: item.transparent }"
             :style="item.bg ? { backgroundColor: item.bg } : null">
          <img v-if="item.thumbUrl" :src="item.thumbUrl" alt=""/>
          <span v-if="savingsOf(item) !== null" class="file-savings card-savings"
                :class="{ grew: savingsOf(item) < 0 }">{{ savingsText(item) }}</span>
          <button class="card-remove" type="button" title="Remove from queue" @click.stop="removeFile(item)">
            <svg viewBox="0 0 12 13" width="10" height="10"><use href="#close"></use></svg>
          </button>
        </div>
        <div class="card-body">
          <p class="file-name" :title="item.file.name">{{ item.file.name }}</p>
          <p class="file-sub">
            <span>{{ formatBytes(item.file.size) }}</span>
            <span class="dot">•</span><span>{{ dimsOf(item) }}</span>
          </p>
          <div class="card-foot">
            <a v-if="item.state === 'done'" class="row-download" :href="item.url" :download="item.outName"
               title="Download this file" @click.stop>Download</a>
            <span v-else-if="item.state === 'processing'" class="row-state"><span class="spinner"></span></span>
            <span v-else-if="item.state === 'error'" class="row-state row-error">Error</span>
            <span v-else class="row-state">Waiting</span>
          </div>
        </div>
      </div>
    </div>

    <!-- list -->
    <div v-else-if="queueLayout === 'list'" class="file-list" role="list">
      <FileRow v-for="item in files" :key="item.id" :item="item" :active="selected === item"
               @select="select(item)" @remove="removeFile(item)" @preview="onImageClick(item)"/>
    </div>

    <!-- details -->
    <div v-else class="file-details">
      <table class="details-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Dimensions</th>
            <th>Size</th>
            <th>New size</th>
            <th>Savings</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in files" :key="item.id" :class="{ active: selected === item }" @click="select(item)">
            <td class="td-name">
              <span class="td-name-inner">
                <span class="details-thumb" :class="{ tilesPattern: item.transparent }"
                      :style="item.bg ? { backgroundColor: item.bg } : null"
                      title="Toggle before/after preview" @click.stop="onImageClick(item)">
                  <img v-if="item.thumbUrl" :src="item.thumbUrl" alt=""/>
                </span>
                <span class="file-name" :title="item.file.name">{{ item.file.name }}</span>
              </span>
            </td>
            <td>{{ dimsOf(item) }}</td>
            <td>{{ formatBytes(item.file.size) }}</td>
            <td>
              <template v-if="item.state === 'done'">{{ formatBytes(item.blob.size) }}</template>
              <span v-else-if="item.state === 'processing'" class="spinner details-spinner"></span>
              <span v-else-if="item.state === 'error'" class="row-error">Error</span>
              <template v-else>—</template>
            </td>
            <td>
              <span v-if="savingsOf(item) !== null" class="file-savings"
                    :class="{ grew: savingsOf(item) < 0 }">{{ savingsText(item) }}</span>
              <template v-else>—</template>
            </td>
            <td class="td-actions">
              <span class="td-actions-inner">
                <a v-if="item.state === 'done'" class="row-download" :href="item.url" :download="item.outName"
                   title="Download this file" @click.stop>Download</a>
                <button class="row-x" type="button" title="Remove from queue" @click.stop="removeFile(item)">
                  <svg viewBox="0 0 12 13" width="10" height="10"><use href="#close"></use></svg>
                </button>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
