<script setup>
// Crawlable copy for search engines; keep the FAQ in sync with the FAQPage JSON-LD in index.html.
const FAQ = [
  {
    q: 'Are my images uploaded to a server?',
    a: 'No. Conversion and resizing run entirely in your browser using its built-in image encoder. Your files never leave your device.',
  },
  {
    q: 'Which formats can I convert to WebP?',
    a: 'JPG/JPEG, PNG, GIF, SVG, BMP, ICO and AVIF. Animated GIFs are converted using their first frame.',
  },
  {
    q: 'Can I convert to PNG, JPG or other formats?',
    a: 'Yes. WebP is the default, but you can also save images as PNG, JPG, BMP or ICO (and AVIF in browsers that support it), or keep each file in its original format.',
  },
  {
    q: 'Can I convert many images at once?',
    a: 'Yes. Drop in as many images as you like, convert them in one batch and download everything as a single ZIP file.',
  },
  {
    q: 'Why use WebP instead of JPG or PNG?',
    a: 'WebP files are typically 25–35% smaller than JPG or PNG at the same visual quality, and support transparency. Smaller images make websites load faster, which helps users and search rankings.',
  },
  {
    q: 'Is the WebP Converter free?',
    a: 'Yes. It is completely free with no sign-up, no watermarks and no file limits.',
  },
]
</script>

<template>
  <section id="faq" class="about" aria-labelledby="about-title">
    <h2 id="about-title" class="about-title">Convert images to WebP in three steps</h2>
    <ol class="about-steps">
      <li><strong>Add images.</strong> Drag and drop JPG, PNG, GIF, SVG, BMP, ICO or AVIF files, or pick them from your device.</li>
      <li><strong>Choose quality and size.</strong> Set the WebP quality and optionally resize, then compare before and after.</li>
      <li><strong>Download.</strong> Save a single image or every converted file at once as a ZIP.</li>
    </ol>

    <h2 class="about-title">Frequently asked questions</h2>
    <div class="about-faq">
      <details v-for="item in FAQ" :key="item.q">
        <summary>{{ item.q }}</summary>
        <p>{{ item.a }}</p>
      </details>
    </div>
  </section>
</template>
