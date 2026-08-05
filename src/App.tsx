import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorCanvas } from './components/EditorCanvas'
import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import { useEditorStore } from './store/useEditorStore'
import { SnapshotModal } from './components/SnapshotModal'
import { ToolDrawer } from './components/ToolDrawer'
import { CommandPalette } from './components/CommandPalette'
import { ShareModal } from './components/ShareModal'
import { DiffViewer } from './components/DiffViewer'
import { applyThemeClass } from './theme/themeStorage'

function App() {
  const loadPersistentState = useEditorStore((state) => state.loadPersistentState)
  const theme = useEditorStore((state) => state.theme)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const isCommandPaletteOpen = useEditorStore((state) => state.isCommandPaletteOpen)
  const setCommandPaletteOpen = useEditorStore((state) => state.setCommandPaletteOpen)
  const commandPaletteReturnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => { void loadPersistentState() }, [loadPersistentState])

  // Keep the .dark class on <html> in sync with the store theme.
  useEffect(() => { applyThemeClass(theme) }, [theme])

  const openCommandPalette = useCallback(() => {
    commandPaletteReturnFocusRef.current = document.activeElement as HTMLElement | null
    setCommandPaletteOpen(true)
  }, [setCommandPaletteOpen])

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openCommandPalette()
      }
    }

    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [openCommandPalette])

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-canvas text-text-primary">
      <Header onSnapshot={() => setShowSnapshots(true)} onTools={() => setShowTools(true)} onShare={() => setShowShare(true)} onDiff={() => setShowDiff(true)} onCommandPalette={openCommandPalette} />
      <TabBar />
      <EditorCanvas />
      {showTools && <ToolDrawer onClose={() => setShowTools(false)} />}
      {showSnapshots && <SnapshotModal onClose={() => setShowSnapshots(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      {showDiff && <DiffViewer onClose={() => setShowDiff(false)} />}
      {isCommandPaletteOpen && <CommandPalette onTools={() => setShowTools(true)} onSnapshots={() => setShowSnapshots(true)} returnFocusRef={commandPaletteReturnFocusRef} />}
      <button className="fixed bottom-3 right-4 z-10 rounded-md px-2 py-1 text-xs text-text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-text-primary" onClick={openCommandPalette}>⌘K commands</button>
    </main>
  )
}

export default App
