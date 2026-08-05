import { useCallback, useEffect, useRef, useState } from 'react'
import { AiPanel, type AiPanelRequest } from './components/AiPanel'
import { AiSettingsModal } from './components/AiSettingsModal'
import { EditorCanvas } from './components/EditorCanvas'
import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import { useEditorStore } from './store/useEditorStore'
import { SnapshotModal } from './components/SnapshotModal'
import { ToolDrawer } from './components/ToolDrawer'
import { CommandPalette } from './components/CommandPalette'
import { ShareModal } from './components/ShareModal'
import { DiffViewer } from './components/DiffViewer'
import { SnipModal } from './components/SnipModal'
import { captureFromFile, imageFromPasteEvent, revokeCaptured, type CapturedImage } from './snip/capture'
import { applyThemeClass } from './theme/themeStorage'

function App() {
  const loadPersistentState = useEditorStore((state) => state.loadPersistentState)
  const flushSave = useEditorStore((state) => state.flushSave)
  const isHydrated = useEditorStore((state) => state.isHydrated)
  const addTab = useEditorStore((state) => state.addTab)
  const theme = useEditorStore((state) => state.theme)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [aiRequest, setAiRequest] = useState<AiPanelRequest | null>(null)
  const [showAiSettings, setShowAiSettings] = useState(false)
  const [showSnip, setShowSnip] = useState(false)
  const [snipImage, setSnipImage] = useState<CapturedImage | null>(null)
  const isCommandPaletteOpen = useEditorStore((state) => state.isCommandPaletteOpen)
  const setCommandPaletteOpen = useEditorStore((state) => state.setCommandPaletteOpen)
  const commandPaletteReturnFocusRef = useRef<HTMLElement | null>(null)
  const quickCaptureHandledRef = useRef(false)

  useEffect(() => { void loadPersistentState() }, [loadPersistentState])

  // Keep the .dark class on <html> in sync with the store theme.
  useEffect(() => { applyThemeClass(theme) }, [theme])

  // Flush debounced IDB writes when the tab is backgrounded or unloaded.
  useEffect(() => {
    const flush = () => { void useEditorStore.getState().flushSave() }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [flushSave])

  // Instant capture entry: /?new=1 opens a fresh note after hydrate.
  useEffect(() => {
    if (!isHydrated || quickCaptureHandledRef.current) return
    const params = new URLSearchParams(window.location.search)
    const wantsNew = params.has('new') && params.get('new') !== '0'
    if (!wantsNew) return
    quickCaptureHandledRef.current = true
    addTab()
    params.delete('new')
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', next)
  }, [addTab, isHydrated])

  const openCommandPalette = useCallback(() => {
    commandPaletteReturnFocusRef.current = document.activeElement as HTMLElement | null
    setCommandPaletteOpen(true)
  }, [setCommandPaletteOpen])

  const openAi = useCallback((request: AiPanelRequest) => {
    setAiRequest(request)
  }, [])

  const openSnip = useCallback((image?: CapturedImage | null) => {
    setSnipImage(image ?? null)
    setShowSnip(true)
  }, [])

  const closeSnip = useCallback(() => {
    setShowSnip(false)
    setSnipImage((prev) => {
      revokeCaptured(prev)
      return null
    })
  }, [])

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openCommandPalette()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        openSnip()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [openCommandPalette, openSnip])

  // Intercept image paste globally → open Snip panel (plain text paste still works in the editor).
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (showSnip || showAiSettings || aiRequest || isCommandPaletteOpen) return
      const target = event.target as HTMLElement | null
      if (target?.closest('textarea, input, [contenteditable="true"]') && !target.closest('.cm-editor')) {
        return
      }
      const file = imageFromPasteEvent(event)
      if (!file) return
      event.preventDefault()
      void captureFromFile(file).then((image) => openSnip(image)).catch(() => undefined)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [aiRequest, isCommandPaletteOpen, openSnip, showAiSettings, showSnip])

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-canvas text-text-primary">
      <Header
        onSnapshot={() => setShowSnapshots(true)}
        onTools={() => setShowTools(true)}
        onShare={() => setShowShare(true)}
        onDiff={() => setShowDiff(true)}
        onCommandPalette={openCommandPalette}
        onAi={() => openAi({ kind: 'ask' })}
        onSnip={() => openSnip()}
      />
      <TabBar />
      <EditorCanvas />
      {showTools && <ToolDrawer onClose={() => setShowTools(false)} />}
      {showSnapshots && <SnapshotModal onClose={() => setShowSnapshots(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      {showDiff && <DiffViewer onClose={() => setShowDiff(false)} />}
      {showAiSettings && <AiSettingsModal onClose={() => setShowAiSettings(false)} />}
      {showSnip && <SnipModal onClose={closeSnip} initialImage={snipImage} />}
      {aiRequest && (
        <AiPanel
          request={aiRequest}
          onClose={() => setAiRequest(null)}
          onNeedSettings={() => setShowAiSettings(true)}
        />
      )}
      {isCommandPaletteOpen && (
        <CommandPalette
          onTools={() => setShowTools(true)}
          onSnapshots={() => setShowSnapshots(true)}
          onAi={openAi}
          onAiSettings={() => setShowAiSettings(true)}
          onSnip={() => openSnip()}
          returnFocusRef={commandPaletteReturnFocusRef}
        />
      )}
      <button className="fixed bottom-3 right-4 z-10 rounded-md px-2 py-1 text-xs text-text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-text-primary" onClick={openCommandPalette}>⌘K commands</button>
    </main>
  )
}

export default App
