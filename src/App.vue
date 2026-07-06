<script setup>
import SvgSprite from '@/components/SvgSprite.vue'
import ErrorToast from '@/components/ErrorToast.vue'
import Workspace from '@/components/Workspace.vue'
import { useView } from '@/composables/useView'
import { useTheme } from '@/composables/useTheme'

const { activeView, VIEWS } = useView()
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <SvgSprite/>
  <ErrorToast/>
  <main class="page" role="main">
    <button class="icon-btn theme-toggle" type="button"
            :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <use :href="theme === 'dark' ? '#sun' : '#moon'"></use>
      </svg>
    </button>

    <header class="hero">
      <svg class="hero-logo" viewBox="0 0 24 24" width="35" height="35"><use href="#logo"></use></svg>
      <h1 class="hero-title">{{ VIEWS[activeView].title }}</h1>
    </header>
    <p class="hero-text">{{ VIEWS[activeView].subtitle }}</p>

    <nav class="view-links" aria-label="Tools">
      <button v-for="(view, key) in VIEWS" :key="key" type="button"
              class="view-link" :class="{ active: activeView === key }"
              @click="activeView = key">{{ view.label }}</button>
      <a class="view-link" href="https://dan13.me/svgtools/">SVG Tools</a>
    </nav>

    <Workspace v-show="activeView === 'convert'" mode="convert"/>
    <Workspace v-show="activeView === 'resize'" mode="resize"/>

    <p class="by">Created with <span>❤️</span> by <a href="https://dan13.me/?utm_source=webp-converter" target="_blank" rel="noopener">DanRotaru</a></p>
  </main>
</template>
