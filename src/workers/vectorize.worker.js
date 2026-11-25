import ImageTracer from 'imagetracerjs'

/* Tracing is synchronous and CPU heavy, so it runs off the main thread. */
self.onmessage = ({ data }) => {
  const { id, imageData, options } = data
  try {
    const svg = ImageTracer.imagedataToSVG(imageData, options)
    self.postMessage({ id, svg })
  } catch (error) {
    self.postMessage({ id, error: String(error?.message || error) })
  }
}
