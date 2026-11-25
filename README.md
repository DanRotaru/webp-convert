# WebP Converter

**Convert and bulk-resize images to WebP, right in your browser. No uploads, no sign-up, no limits.**

🔗 **Live app:** [dan13.me/webp-convert](https://dan13.me/webp-convert/)

---

## Why this project exists

WebP files are usually much smaller than JPG or PNG at the same visual quality, so they make websites faster.
Most online converters, though, ask you to **upload your images to someone else's server**, cap how many files
you can convert, or put the download behind ads and accounts.

WebP Converter does the whole job **locally in your browser**:

- **Your images never leave your device.** Conversion runs on the browser's own image encoder, with no server involved.
- **Batch-friendly.** Drop in one image or a whole folder and download everything as a single ZIP.
- **You see what you get.** A before/after comparison shows the quality and size trade-off before you download.

It is a small, focused tool: drop images in, pick a quality, download.

## Features

- **Convert to WebP** from JPG, PNG, GIF, SVG, BMP, ICO and AVIF.
- **Bulk resize** many images at once, each keeping its original format (GIF, SVG, BMP and ICO are saved as PNG).
- **Adjustable quality** (10–100%) for WebP output.
- **Custom dimensions**: set width, height or both, with an aspect-ratio lock.
- **Drag & drop** files, or add a **whole folder** at once.
- **Before/after preview** with a draggable split slider, zoom and pan.
- **Live re-processing**: change a setting and the whole queue updates automatically.
- **Size savings at a glance**: original size, new size and the percentage saved for every file.
- **Three queue layouts**: cards, list and a detailed table.
- **Download** files one by one, all as a **ZIP archive** or as separate files.
- **Light & dark theme**, remembered between visits.

## Privacy

Everything happens on your device. Images are read, resized and encoded with the browser's canvas API and are
**never uploaded anywhere**. The app has no backend and no accounts, and it stores nothing except your theme and
layout preference in `localStorage`.

## Tech stack

| Area | Used |
| --- | --- |
| UI | [Vue 3](https://vuejs.org) |
| Build | [Vite](https://vite.dev) |
| Image processing | Browser Canvas API (`canvas.toBlob`) |
| ZIP downloads | [JSZip](https://stuk.github.io/jszip/) + [FileSaver.js](https://github.com/eligrey/FileSaver.js) |
| Hosting | GitHub Pages |

## Getting started

Requirements: [Node.js](https://nodejs.org) `^22.18.0` or `>=24.12.0`, and npm.

```bash
npm install
npm run dev       # start the dev server
npm run build     # build into dist/
npm run preview   # serve the production build locally
```

Pushes to `master` are built and deployed to GitHub Pages automatically
(see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

## Support

If WebP Converter is useful to you, you can
[buy me a coffee ☕](https://buymeacoffee.com/danrotaru).

---

Made by [Dan Rotaru](https://dan13.me/).
