/**
 * Canvas helpers to improve OCR accuracy before Tesseract.
 * Pure DOM canvas ops — no network.
 */

export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode that image.'))
    }
    img.src = url
  })
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode that image.'))
    img.src = dataUrl
  })
}

/** Crop source image to pixel rect (clamped). */
export function cropToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  crop: { x: number; y: number; width: number; height: number },
): HTMLCanvasElement {
  const x = Math.max(0, Math.min(Math.floor(crop.x), sourceWidth - 1))
  const y = Math.max(0, Math.min(Math.floor(crop.y), sourceHeight - 1))
  const width = Math.max(1, Math.min(Math.floor(crop.width), sourceWidth - x))
  const height = Math.max(1, Math.min(Math.floor(crop.height), sourceHeight - y))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')
  ctx.drawImage(source, x, y, width, height, 0, 0, width, height)
  return canvas
}

/**
 * Upscale small crops and convert to high-contrast grayscale for OCR.
 */
export function prepareForOcr(source: HTMLCanvasElement, scale = 2): HTMLCanvasElement {
  const w = Math.max(1, Math.round(source.width * scale))
  const h = Math.max(1, Math.round(source.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  // Grayscale + simple contrast stretch
  let min = 255
  let max = 0
  const gray = new Uint8Array(w * h)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    gray[p] = g
    if (g < min) min = g
    if (g > max) max = g
  }
  const range = Math.max(1, max - min)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = Math.round(((gray[p] - min) / range) * 255)
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Failed to encode snip image.'))
      else resolve(blob)
    }, type, quality)
  })
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): string {
  return canvas.toDataURL(type, quality)
}

/** Insert OCR text at a character offset (CodeMirror-style). */
export function insertAtOffset(content: string, offset: number, text: string): string {
  const pos = Math.max(0, Math.min(offset, content.length))
  const before = content.slice(0, pos)
  const after = content.slice(pos)
  const needsLead = before.length > 0 && !before.endsWith('\n') && !text.startsWith('\n')
  const needsTrail = after.length > 0 && !after.startsWith('\n') && !text.endsWith('\n')
  const block = `${needsLead ? '\n\n' : ''}${text.trimEnd()}${needsTrail ? '\n\n' : text.endsWith('\n') ? '' : '\n'}`
  return before + block + after
}
