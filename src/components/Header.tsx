import { EyeOff, History, Moon, PanelRight, Share2, Sun, Terminal, GitCompare } from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'

export function Header({
  onSnapshot,
  onTools,
  onShare,
  onDiff,
  onCommandPalette,
}: {
  onSnapshot: () => void
  onTools: () => void
  onShare: () => void
  onDiff: () => void
  onCommandPalette: () => void
}) {
  const { tabs, activeTabId, setTitle, theme, setTheme, toggleZenMode, isZenMode, isSaving, takeSnapshot } = useEditorStore()
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const createSnapshot = async () => { await takeSnapshot(); onSnapshot() }

  if (isZenMode) return <button className="fixed right-4 top-4 z-20 rounded-full bg-slate-800 p-2 text-slate-300 shadow-lg hover:text-white" onClick={toggleZenMode} aria-label="Exit zen mode"><EyeOff size={16} /></button>

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 text-slate-200">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-md border border-indigo-500/30 bg-indigo-600/20 px-2.5 py-1 text-sm font-bold tracking-tight text-indigo-400">APEXPAD</span>
        <input className="w-56 min-w-0 border-b border-transparent bg-transparent px-1 py-0.5 text-sm font-medium outline-none hover:border-slate-600 focus:border-indigo-500" value={activeTab?.title ?? ''} onChange={(event) => setTitle(event.target.value)} aria-label="Note title" />
        <span className="hidden text-xs text-slate-400 sm:inline">{isSaving ? 'Saving...' : 'Saved locally'}</span>
      </div>
      <div className="flex items-center gap-1">
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => void createSnapshot()} title="Create snapshot" aria-label="Create snapshot"><History size={16} /></button>
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={onTools} title="Text tools" aria-label="Text tools"><PanelRight size={16} /></button>
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={onShare} title="Encrypted sharing" aria-label="Encrypted sharing"><Share2 size={16} /></button>
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={onDiff} title="Compare latest snapshot" aria-label="Compare latest snapshot"><GitCompare size={16} /></button>
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={onCommandPalette} title="Command palette" aria-label="Command palette"><Terminal size={16} /></button>
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={toggleZenMode} title="Zen mode" aria-label="Zen mode"><EyeOff size={16} /></button>
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme" aria-label="Toggle theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
      </div>
    </header>
  )
}
