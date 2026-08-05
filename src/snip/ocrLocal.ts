import { createWorker, type Worker } from 'tesseract.js'
import type { OcrResult } from './types'

let workerPromise: Promise<Worker> | null = null

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', 1, {
        // Use CDN language data; keeps the install light. Offline second visit may cache via SW/browser.
        logger: () => undefined,
      })
      return worker
    })()
  }
  return workerPromise
}

/** Run English OCR on a canvas or image element. */
export async function recognizeText(
  image: HTMLCanvasElement | HTMLImageElement | Blob | string,
): Promise<OcrResult> {
  const worker = await getWorker()
  const { data } = await worker.recognize(image)
  const text = (data.text || '').replace(/\r\n/g, '\n').trim()
  return {
    text,
    confidence: typeof data.confidence === 'number' ? data.confidence : 0,
  }
}

/** Optional cleanup (not required for normal app lifetime). */
export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return
  const worker = await workerPromise
  workerPromise = null
  await worker.terminate()
}
