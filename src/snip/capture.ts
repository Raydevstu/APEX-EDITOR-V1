import type { SnipSource } from './types'

export interface CapturedImage {
  blob: Blob
  objectUrl: string
  source: SnipSource
  width: number
  height: number
}

function isImageFile(file: File | null | undefined): file is File {
  return Boolean(file && file.type.startsWith('image/'))
}

async function blobToCaptured(blob: Blob, source: SnipSource): Promise<CapturedImage> {
  const objectUrl = URL.createObjectURL(blob)
  const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Could not read image dimensions.'))
    img.src = objectUrl
  })
  return { blob, objectUrl, source, width: dims.width, height: dims.height }
}

export function revokeCaptured(image: CapturedImage | null | undefined): void {
  if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl)
}

/** Read first image file from a FileList / drag-drop. */
export async function captureFromFile(file: File): Promise<CapturedImage> {
  if (!isImageFile(file)) throw new Error('Please choose an image file (PNG, JPG, WebP, …).')
  return blobToCaptured(file, 'file')
}

export async function captureFromDataTransfer(data: DataTransfer | null): Promise<CapturedImage | null> {
  if (!data) return null
  const files = [...data.files]
  const imageFile = files.find((f) => f.type.startsWith('image/'))
  if (imageFile) return captureFromFile(imageFile)

  // Some browsers expose clipboard image as items
  for (const item of data.items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return captureFromFile(file)
    }
  }
  return null
}

/** Read image from system clipboard (requires secure context + permission / paste gesture). */
export async function captureFromClipboard(): Promise<CapturedImage | null> {
  if (!navigator.clipboard?.read) return null
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      const type = item.types.find((t) => t.startsWith('image/'))
      if (!type) continue
      const blob = await item.getType(type)
      return blobToCaptured(blob, 'clipboard')
    }
  } catch {
    // Permission denied or empty clipboard — caller can fall back to paste event.
    return null
  }
  return null
}

/** Whether the browser claims to support screen capture (API presence only). */
export function isScreenCaptureSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (!window.isSecureContext) return false
  const media = navigator.mediaDevices
  return Boolean(media && typeof media.getDisplayMedia === 'function')
}

function errorName(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err && typeof (err as { name: unknown }).name === 'string') {
    return (err as { name: string }).name
  }
  return ''
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

function mapDisplayMediaError(err: unknown): Error {
  const name = errorName(err)
  const msg = errorMessage(err)

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    // User closed the picker, or site/OS blocked capture.
    if (/dismiss|cancel|abort|denied/i.test(msg) || msg === '') {
      return new Error('Screen capture was cancelled or blocked. If the picker never opened, check browser site settings for “Screen” permission.')
    }
    return new Error(`Screen capture blocked: ${msg}`)
  }
  if (name === 'NotFoundError' || name === 'AbortError') {
    return new Error('No screen or window was selected.')
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return new Error('Could not read the selected screen (in use by another app). Try again or use Win+Shift+S → Clipboard.')
  }
  if (name === 'NotSupportedError' || name === 'TypeError') {
    return new Error(
      `Screen capture API rejected the request (${name}${msg ? `: ${msg}` : ''}). ` +
        'This often happens in embedded browsers, locked-down Edge/Chrome policies, or non-localhost HTTP. ' +
        'Use Win+Shift+S, then Clipboard image — that path works offline.',
    )
  }
  if (name || msg) {
    return new Error(`Screen capture failed${name ? ` (${name})` : ''}${msg ? `: ${msg}` : ''}.`)
  }
  return new Error('Screen capture failed.')
}

/**
 * Ask the OS/browser for a display surface. Must be called directly from a
 * user gesture (click) — do not await React state updates first.
 *
 * Tries several option shapes; some Chromium builds reject certain constraint
 * combinations with NotSupportedError while accepting a bare call.
 */
export async function requestDisplayStream(): Promise<MediaStream> {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error(
      `Screen capture needs a secure context (https or localhost). This page is: ${window.location.protocol}//${window.location.host || '(no host)'}`,
    )
  }

  const media = navigator.mediaDevices
  const getDisplay =
    media && typeof media.getDisplayMedia === 'function'
      ? media.getDisplayMedia.bind(media)
      : typeof (navigator as Navigator & { getDisplayMedia?: typeof media.getDisplayMedia }).getDisplayMedia === 'function'
        ? (navigator as Navigator & { getDisplayMedia: typeof media.getDisplayMedia }).getDisplayMedia.bind(navigator)
        : null

  if (!getDisplay) {
    throw new Error('Screen capture is not supported in this browser. Use Clipboard or Upload instead.')
  }

  // Ordered from most compatible → more specific. First success wins.
  const attempts: Array<DisplayMediaStreamOptions | undefined> = [
    undefined, // bare call — most compatible
    { video: true },
    { video: true, audio: false },
    { video: { frameRate: 1 } },
  ]

  let lastError: unknown
  for (const options of attempts) {
    try {
      const stream = options === undefined ? await getDisplay() : await getDisplay(options)
      if (stream?.getVideoTracks?.().length) return stream
      stream?.getTracks?.().forEach((t) => t.stop())
      lastError = new Error('Display stream had no video track.')
    } catch (err) {
      lastError = err
      const name = errorName(err)
      // User cancelled — don't keep retrying (would re-open the picker).
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'AbortError') {
        throw mapDisplayMediaError(err)
      }
      // Try next option shape for NotSupported / overconstrained / type errors.
    }
  }

  throw mapDisplayMediaError(lastError)
}

async function frameFromStream(stream: MediaStream): Promise<Blob> {
  const track = stream.getVideoTracks()[0]
  if (!track) throw new Error('No video track from screen capture.')

  // Prefer ImageCapture when available (more reliable freeze-frame).
  try {
    const ImageCaptureCtor = (window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => { grabFrame: () => Promise<ImageBitmap> } }).ImageCapture
    if (ImageCaptureCtor) {
      const capture = new ImageCaptureCtor(track)
      const bitmap = await capture.grabFrame()
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas is unavailable.')
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode screen frame.'))), 'image/png')
      })
      if (blob) return blob
    }
  } catch {
    // Fall through to <video> path.
  }

  const video = document.createElement('video')
  video.playsInline = true
  video.muted = true
  video.setAttribute('playsinline', 'true')
  video.srcObject = stream

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for the screen frame.'))
    }, 8000)

    const cleanup = () => {
      window.clearTimeout(timeout)
      video.onloadeddata = null
      video.onerror = null
    }

    const tryReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup()
        resolve()
      }
    }

    video.onloadeddata = tryReady
    video.onerror = () => {
      cleanup()
      reject(new Error('Could not play the screen capture stream.'))
    }

    void video.play().then(tryReady).catch((playErr) => {
      cleanup()
      reject(playErr instanceof Error ? playErr : new Error('Could not start screen preview.'))
    })
  })

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  let width = video.videoWidth
  let height = video.videoHeight
  if (width < 2 || height < 2) {
    const settings = track.getSettings()
    width = settings.width ?? 0
    height = settings.height ?? 0
  }
  if (width < 2 || height < 2) {
    throw new Error('Screen frame had no size. Try again or use Clipboard / Upload.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')
  ctx.drawImage(video, 0, 0, width, height)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode screen frame.'))), 'image/png')
  })
}

/**
 * Capture a full screen/window/tab via getDisplayMedia, return one freeze-frame.
 * User still crops in the Snip UI.
 *
 * Prefer calling `requestDisplayStream()` from the click handler first (keeps
 * user activation), then pass the stream here — or call this helper alone.
 */
export async function captureFromScreen(existingStream?: MediaStream): Promise<CapturedImage> {
  const stream = existingStream ?? (await requestDisplayStream())
  try {
    const blob = await frameFromStream(stream)
    return blobToCaptured(blob, 'screen')
  } finally {
    stream.getTracks().forEach((t) => t.stop())
  }
}

export function imageFromPasteEvent(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items
  if (!items) return null
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      return item.getAsFile()
    }
  }
  return null
}
