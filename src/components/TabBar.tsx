import { Plus, X } from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab, isZenMode } = useEditorStore()
  if (isZenMode) return null

  return (
    <nav className="flex h-10 shrink-0 items-stretch overflow-x-auto border-b border-slate-800 bg-slate-950" aria-label="Open notes">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        return (
          <div key={tab.id} className={`group flex min-w-44 max-w-60 items-center border-r border-slate-800 px-3 text-xs transition-colors ${active ? 'border-t-2 border-t-indigo-500 bg-slate-900 text-slate-100' : 'border-t-2 border-t-transparent text-slate-400 hover:bg-slate-900/70 hover:text-slate-300'}`}>
            <button className="min-w-0 flex-1 truncate text-left" onClick={() => setActiveTab(tab.id)} title={tab.title || 'Untitled Note'}>
              {tab.title || 'Untitled Note'}
            </button>
            <button className={`ml-2 rounded p-1 hover:bg-slate-700 hover:text-white ${active ? 'opacity-100' : 'opacity-80'}`} onClick={() => closeTab(tab.id)} aria-label={`Close ${tab.title || 'Untitled Note'}`}>
              <X size={13} />
            </button>
          </div>
        )
      })}
      <button className="m-1.5 rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white" onClick={addTab} aria-label="Create new tab" title="New tab (Ctrl+T)">
        <Plus size={15} />
      </button>
    </nav>
  )
}
