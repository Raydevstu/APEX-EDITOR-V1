import { Crop, ImagePlus, Loader2, Scissors } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  captureFromClipboard,
  captureFromFile,
  captureFromScreen,
  isScreenCaptureSupported,
  requestDisplayStream,
  revokeCaptured,
  type CapturedImage,
} from '../snip/capture'
import { recognizeText } from '../snip/ocrLocal'
import {
  cropToCanvas,
  insertAtOffset,
  loadImageFromBlob,
  prepareForOcr,
} from '../snip/preprocess'
import { getEditorSelection } from '../ai/editorSelection'
import { useEditorStore } from '../store/useEditorStore'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

type Step = 'source' | 'crop' | 'result'

interface DragRect {
  startX: number
  startY: number
  x: number
  y: number
  width: number
  height: number
}

export function SnipModal({
  onClose,
  initialImage,
}: {
  onClose: () => void
  /** Optional image opened from paste/drop outside the modal. */
  initialImage?: CapturedImage | null
}) {
  const setContent = useEditorStore((state) => state.setContent)
  const takeSnapshot = useEditorStore((state) => state.takeSnapshot)
  const tabs = useEditorStore((state) => state.tabs)
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  const [step, setStep] = useState<Step>(initialImage ? 'crop' : 'source')
  const [captured, setCaptured] = useState<CapturedImage | null>(initialImage ?? null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [applied, setApplied] = useState(false)

  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [drag, setDrag] = useState<DragRect | null>(null)
  const [selection, setSelection] = useState<DragRect | null>(null)
  const dragging = useRef(false)

  // Own the object URL lifecycle for images we create inside the modal.
  const ownedRef = useRef<CapturedImage | null>(null)

  const replaceCaptured = useCallback((next: CapturedImage | null) => {
    if (ownedRef.current && ownedRef.current !== initialImage) {
      revokeCaptured(ownedRef.current)
    }
    ownedRef.current = next
    setCaptured(next)
  }, [initialImage])

  useEffect(() => {
    if (initialImage) {
      ownedRef.current = null // caller owns this one
      setCaptured(initialImage)
      setStep('crop')
      setNatural({ w: initialImage.width, h: initialImage.height })
    }
  }, [initialImage])

  useEffect(() => () => {
    if (ownedRef.current && ownedRef.current !== initialImage) {
      revokeCaptured(ownedRef.current)
    }
  }, [initialImage])

  const onImageLoad = () => {
    const img = imgRef.current
    if (!img) return
    setNatural({ w: img.naturalWidth, h: img.naturalHeight })
  }

  const loadFile = async (file: File) => {
    setError('')
    setBusy(true)
    setBusyLabel('Loading image…')
    try {
      const image = await captureFromFile(file)
      replaceCaptured(image)
      setSelection(null)
      setOcrText('')
      setConfidence(null)
      setApplied(false)
      setStep('crop')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image.')
    } finally {
      setBusy(false)
      setBusyLabel('')
    }
  }

  const loadClipboardImage = async () => {
    setError('')
    setBusy(true)
    setBusyLabel('Reading clipboard…')
    try {
      const image = await captureFromClipboard()
      if (!image) {
        setError('No image on the clipboard. Use Win+Shift+S, then try again — or paste (Ctrl+V) here.')
        return
      }
      replaceCaptured(image)
      setSelection(null)
      setOcrText('')
      setStep('crop')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clipboard read failed.')
    } finally {
      setBusy(false)
      setBusyLabel('')
    }
  }

  const loadScreenCapture = async () => {
    // IMPORTANT: start getDisplayMedia in the same turn as the click so the
    // browser still has a valid user activation. Any await/setState before the
    // request can make Chrome/Edge reject with NotSupportedError / NotAllowedError.
    setError('')
    let stream: MediaStream | undefined
    try {
      stream = await requestDisplayStream()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screen capture failed.')
      return
    }

    setBusy(true)
    setBusyLabel('Capturing frame…')
    try {
      const image = await captureFromScreen(stream)
      stream = undefined // ownership transferred; captureFromScreen stops tracks
      replaceCaptured(image)
      setSelection(null)
      setOcrText('')
      setConfidence(null)
      setApplied(false)
      setStep('crop')
    } catch (err) {
      stream?.getTracks().forEach((t) => t.stop())
      setError(err instanceof Error ? err.message : 'Screen capture failed.')
    } finally {
      setBusy(false)
      setBusyLabel('')
    }
  }

  const screenSupported = isScreenCaptureSupported()

  /** Map pointer coords in the stage to natural image pixels. */
  const toNatural = (clientX: number, clientY: number) => {
    const stage = stageRef.current
    const img = imgRef.current
    if (!stage || !img || !natural.w || !natural.h) return { x: 0, y: 0 }
    const rect = img.getBoundingClientRect()
    const relX = (clientX - rect.left) / rect.width
    const relY = (clientY - rect.top) / rect.height
    return {
      x: Math.max(0, Math.min(natural.w, relX * natural.w)),
      y: Math.max(0, Math.min(natural.h, relY * natural.h)),
    }
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    if (step !== 'crop' || !captured) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragging.current = true
    const p = toNatural(event.clientX, event.clientY)
    const rect: DragRect = { startX: p.x, startY: p.y, x: p.x, y: p.y, width: 0, height: 0 }
    setDrag(rect)
    setSelection(null)
  }

  const onPointerMove = (event: ReactPointerEvent) => {
    if (!dragging.current || !drag) return
    const p = toNatural(event.clientX, event.clientY)
    const x = Math.min(drag.startX, p.x)
    const y = Math.min(drag.startY, p.y)
    const width = Math.abs(p.x - drag.startX)
    const height = Math.abs(p.y - drag.startY)
    setDrag({ ...drag, x, y, width, height })
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    if (drag && drag.width > 4 && drag.height > 4) {
      setSelection(drag)
    }
    setDrag(null)
  }

  const activeRect = drag ?? selection

  const runOcr = async () => {
    if (!captured) return
    setError('')
    setBusy(true)
    setBusyLabel('Converting image to text (offline OCR)…')
    setApplied(false)
    try {
      const img = await loadImageFromBlob(captured.blob)
      const cropRect = selection && selection.width > 4 && selection.height > 4
        ? selection
        : { x: 0, y: 0, width: natural.w || img.naturalWidth, height: natural.h || img.naturalHeight }

      const cropped = cropToCanvas(img, img.naturalWidth, img.naturalHeight, cropRect)
      const prepared = prepareForOcr(cropped, cropped.width < 400 ? 3 : 2)
      const result = await recognizeText(prepared)
      if (!result.text.trim()) {
        setError('No text detected. Try a tighter crop or a sharper image.')
        setOcrText('')
        setConfidence(null)
        return
      }
      setOcrText(result.text)
      setConfidence(result.confidence)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed.')
    } finally {
      setBusy(false)
      setBusyLabel('')
    }
  }

  const insertText = async () => {
    if (!ocrText.trim() || !activeTab) return
    await takeSnapshot()
    const sel = getEditorSelection()
    const offset =
      sel && sel.tabId === activeTabId
        ? sel.from
        : activeTab.content.length
    setContent(insertAtOffset(activeTab.content, offset, ocrText))
    setApplied(true)
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(ocrText)
    } catch {
      setError('Could not copy to clipboard.')
    }
  }

  const displayRect = (() => {
    if (!activeRect || !imgRef.current || !natural.w) return null
    const img = imgRef.current
    const rect = img.getBoundingClientRect()
    const stage = stageRef.current?.getBoundingClientRect()
    if (!stage) return null
    const scaleX = rect.width / natural.w
    const scaleY = rect.height / natural.h
    return {
      left: rect.left - stage.left + activeRect.x * scaleX,
      top: rect.top - stage.top + activeRect.y * scaleY,
      width: activeRect.width * scaleX,
      height: activeRect.height * scaleY,
    }
  })()

  return (
    <Dialog
      open
      onClose={onClose}
      title="Snip → text"
      titleId="snip-title"
      icon={<Scissors size={16} className="text-text-muted" aria-hidden="true" />}
      closeLabel="Close snip"
      maxWidth="max-w-2xl"
    >
      <p className="mb-3 text-xs text-text-muted">
        Capture or paste a screenshot, crop the text region, then convert offline with Tesseract. Tip: Win+Shift+S → Ctrl+V here.
      </p>

      {step === 'source' && (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="primary" onClick={() => void loadClipboardImage()} disabled={busy}>
              Clipboard image
            </Button>
            <Button
              variant="secondary"
              onClick={() => void loadScreenCapture()}
              disabled={busy || !screenSupported}
              title={
                screenSupported
                  ? 'Capture a monitor, window, or browser tab'
                  : 'Screen capture API unavailable — use Clipboard or Upload'
              }
            >
              Screen / window
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void loadFile(file)
                e.target.value = ''
              }}
            />
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={16} aria-hidden="true" />
              Upload
            </Button>
          </div>

          <div
            className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-canvas px-4 py-6 text-center text-sm text-text-muted"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files?.[0]
              if (file) void loadFile(file)
            }}
            onPaste={(e) => {
              const items = e.clipboardData?.items
              if (!items) return
              for (const item of items) {
                if (item.type.startsWith('image/')) {
                  e.preventDefault()
                  const file = item.getAsFile()
                  if (file) void loadFile(file)
                  return
                }
              }
            }}
            tabIndex={0}
            role="region"
            aria-label="Drop or paste image"
          >
            Drop an image here, or paste with Ctrl+V
          </div>
        </div>
      )}

      {step === 'crop' && captured && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">
            Drag on the image to crop (optional). Leave uncropped to OCR the full image.
          </p>
          <div
            ref={stageRef}
            className="relative max-h-80 overflow-auto rounded-md border border-border bg-canvas select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              ref={imgRef}
              src={captured.objectUrl}
              alt="Snip preview"
              onLoad={onImageLoad}
              className="mx-auto block max-h-80 max-w-full"
              draggable={false}
            />
            {displayRect && (
              <div
                className="pointer-events-none absolute border-2 border-accent bg-accent/15"
                style={{
                  left: displayRect.left,
                  top: displayRect.top,
                  width: displayRect.width,
                  height: displayRect.height,
                }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void runOcr()} disabled={busy} loading={busy}>
              <Crop size={16} aria-hidden="true" />
              Convert to text
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setSelection(null)
                setDrag(null)
              }}
            >
              Clear crop
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setStep('source')
                setSelection(null)
              }}
            >
              New image
            </Button>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-3">
          {confidence != null && (
            <p className="text-xs text-text-muted">
              OCR confidence: {Math.round(confidence)}% (edit before inserting if needed)
            </p>
          )}
          <textarea
            value={ocrText}
            onChange={(e) => { setOcrText(e.target.value); setApplied(false) }}
            aria-label="OCR result"
            className="h-48 w-full resize-y rounded-md border border-border bg-canvas p-3 font-mono text-sm text-text-primary"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void insertText()} disabled={!ocrText.trim() || applied}>
              {applied ? 'Inserted' : 'Insert into note'}
            </Button>
            <Button variant="secondary" onClick={() => void copyText()} disabled={!ocrText.trim()}>
              Copy text
            </Button>
            <Button variant="ghost" onClick={() => setStep('crop')} disabled={busy}>
              Back to crop
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
          {applied && (
            <p role="status" className="text-xs text-success">
              Inserted at cursor (or end of note). A snapshot was taken first.
            </p>
          )}
        </div>
      )}

      {busy && (
        <p className="mt-3 flex items-center gap-2 text-sm text-text-secondary" role="status">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          {busyLabel || 'Working…'}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">{error}</p>
      )}
    </Dialog>
  )
}
