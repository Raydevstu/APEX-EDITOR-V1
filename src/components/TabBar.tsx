import { Plus, X } from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab, isZenMode } = useEditorStore()
  if (isZenMode) return null

  return (
    <nav className="flex h-10 shrink-0 items-stretch overflow-x-auto border-b border-hairline bg-canvas" aria-label="Open notes">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={`group relative flex min-w-44 max-w-60 items-center border-r border-hairline px-3 text-xs transition-colors duration-150 ${
              active
                ? 'border-t-2 border-t-accent bg-surface text-text-primary'
                : 'border-t-2 border-t-transparent text-text-muted hover:bg-surfaceHover hover:text-text-secondary'
            }`}
          >
            <button className="min-w-0 flex-1 truncate text-left" onClick={() => setActiveTab(tab.id)} title={tab.title || 'Untitled Note'}>
              {tab.title || 'Untitled Note'}
            </button>
            <button
              className={`ml-2 rounded p-1 transition-colors hover:bg-surfaceActive hover:text-text-primary ${active ? 'opacity-100' : 'opacity-80'}`}
              onClick={() => closeTab(tab.id)}
              aria-label={`Close ${tab.title || 'Untitled Note'}`}
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
      <button
        className="m-1.5 flex items-center justify-center rounded-md p-1.5 text-text-muted transition-colors hover:bg-surfaceHover hover:text-text-primary"
        onClick={addTab}
        aria-label="Create new tab"
        title="New tab (Ctrl+T)"
      >
        <Plus size={15} />
      </button>
    </nav>
  )
}
