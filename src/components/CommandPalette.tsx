import { FilePlus2, History, Search, Wrench } from 'lucide-react'
import { useState, type RefObject } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { Dialog } from '../ui/Dialog'

export function CommandPalette({ onTools, onSnapshots, returnFocusRef }: { onTools: () => void; onSnapshots: () => void; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const [query, setQuery] = useState('')
  const addTab = useEditorStore((state) => state.addTab)
  const setOpen = useEditorStore((state) => state.setCommandPaletteOpen)
  const commands = [
    { label: 'New note', hint: 'Ctrl+T', icon: FilePlus2, action: addTab },
    { label: 'Open text tools', hint: '', icon: Wrench, action: onTools },
    { label: 'Open snapshots', hint: '', icon: History, action: onSnapshots },
  ]
  const filtered = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()))

  const run = (action: () => void) => {
    // Restore focus to whatever opened the palette before closing.
    const target = returnFocusRef?.current ?? null
    setOpen(false)
    action()
    if (target) window.setTimeout(() => target.focus(), 0)
  }

  return (
    <Dialog
      open
      onClose={() => setOpen(false)}
      title="Command palette"
      titleId="command-palette-title"
      placement="top"
      maxWidth="max-w-lg"
      closeLabel="Close commands"
    >
      <div className="flex items-center gap-2 border-b border-hairline px-4">
        <Search size={16} className="text-text-muted" aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a command…"
          aria-label="Search commands"
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-text-faint"
        />
      </div>
      <div className="p-2">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-text-muted">No commands match “{query}”.</p>
        ) : (
          filtered.map(({ label, hint, icon: Icon, action }) => (
            <button
              key={label}
              onClick={() => run(action)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors duration-150 hover:bg-surfaceHover hover:text-text-primary focus-visible:bg-surfaceHover"
            >
              <Icon size={16} aria-hidden="true" className="text-text-muted" />
              <span className="flex-1 text-left">{label}</span>
              {hint && <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">{hint}</kbd>}
            </button>
          ))
        )}
      </div>
    </Dialog>
  )
}
