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

function App() {
  const loadPersistentState = useEditorStore((state) => state.loadPersistentState)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const isCommandPaletteOpen = useEditorStore((state) => state.isCommandPaletteOpen)
  const setCommandPaletteOpen = useEditorStore((state) => state.setCommandPaletteOpen)
  const commandPaletteReturnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => { void loadPersistentState() }, [loadPersistentState])

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
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
      <Header onSnapshot={() => setShowSnapshots(true)} onTools={() => setShowTools(true)} onShare={() => setShowShare(true)} onDiff={() => setShowDiff(true)} onCommandPalette={openCommandPalette} />
      <TabBar />
      <EditorCanvas />
      {showTools && <ToolDrawer onClose={() => setShowTools(false)} />}
      {showSnapshots && <SnapshotModal onClose={() => setShowSnapshots(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      {showDiff && <DiffViewer onClose={() => setShowDiff(false)} />}
      {isCommandPaletteOpen && <CommandPalette onTools={() => setShowTools(true)} onSnapshots={() => setShowSnapshots(true)} returnFocusRef={commandPaletteReturnFocusRef} />}
      <button className="fixed bottom-3 right-4 text-xs text-slate-400 hover:text-slate-300" onClick={openCommandPalette}>⌘K commands</button>
    </main>
  )
}

export default App
