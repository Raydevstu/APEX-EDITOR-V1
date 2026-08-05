import { FilePlus2, History, Search, Wrench, X } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useEditorStore } from '../store/useEditorStore'

export function CommandPalette({ onTools, onSnapshots, returnFocusRef }: { onTools: () => void; onSnapshots: () => void; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const [query, setQuery] = useState('')
  const addTab = useEditorStore((state) => state.addTab)
  const setOpen = useEditorStore((state) => state.setCommandPaletteOpen)
  const dialogRef = useRef<HTMLElement>(null)
  const commands = [{ label: 'New note', icon: FilePlus2, action: addTab }, { label: 'Open text tools', icon: Wrench, action: onTools }, { label: 'Open snapshots', icon: History, action: onSnapshots }]
  const filtered = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()))
  useLayoutEffect(() => {
    const returnFocusTarget = returnFocusRef?.current ?? null
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('input, button')].filter((item) => !item.hasAttribute('disabled'))
      const index = focusable.indexOf(document.activeElement as HTMLElement)
      event.preventDefault()
      focusable[(index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus()
    }
    window.addEventListener('keydown', handle)
    dialogRef.current?.querySelector<HTMLElement>('input')?.focus()
    return () => {
      window.removeEventListener('keydown', handle)
      window.setTimeout(() => returnFocusTarget?.focus(), 0)
    }
  }, [setOpen, returnFocusRef])
  return <div className="fixed inset-0 z-40 bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={() => setOpen(false)}><section ref={dialogRef} className="mx-auto mt-20 max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-2 border-b border-slate-800 px-4"><Search size={16} className="text-slate-400" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a command..." aria-label="Search commands" className="h-12 flex-1 bg-transparent text-sm outline-none" /><button onClick={() => setOpen(false)} aria-label="Close command palette"><X size={16} /></button></div><div className="p-2">{filtered.map(({ label, icon: Icon, action }) => <button key={label} onClick={() => { action(); setOpen(false) }} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">{<Icon size={16} />}{label}</button>)}</div></section></div>
}
