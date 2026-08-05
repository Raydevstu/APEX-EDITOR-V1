import { Braces, Check, ListX, Rows3, X } from 'lucide-react'
import { useState } from 'react'
import { useModalFocus } from '../hooks/useModalFocus'
import { useEditorStore } from '../store/useEditorStore'
import { processText } from '../utils/workerManager'
import type { TextTool } from '../utils/textTools'

const tools: Array<{ id: TextTool; label: string; icon: typeof Braces }> = [
  { id: 'format-json', label: 'Format JSON', icon: Braces },
  { id: 'strip-whitespace', label: 'Trim empty lines', icon: Rows3 },
  { id: 'dedupe-lines', label: 'Dedupe lines', icon: ListX },
  { id: 'format-csv', label: 'Format CSV spacing', icon: Rows3 },
]

export function ToolDrawer({ onClose }: { onClose: () => void }) {
  const content = useEditorStore((state) => state.tabs.find((tab) => tab.id === state.activeTabId)?.content ?? '')
  const setContent = useEditorStore((state) => state.setContent)
  const [message, setMessage] = useState('Runs off the main thread')
  const dialogRef = useModalFocus(onClose)
  const run = async (tool: TextTool) => { try { setContent(await processText(tool, content)); setMessage('Applied successfully') } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not apply tool') } }
  return <div className="fixed inset-0 z-20 flex items-start justify-end bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="tool-drawer-title" onMouseDown={onClose}>
    <aside ref={dialogRef} onMouseDown={(event) => event.stopPropagation()} className="w-72 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl" aria-label="Text tools">
      <div className="mb-3 flex items-center justify-between"><h2 id="tool-drawer-title" className="text-sm font-semibold text-slate-100">Text tools</h2><button onClick={onClose} aria-label="Close tools"><X size={16} /></button></div>
      <div className="space-y-1">{tools.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => void run(id)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><Icon size={16} aria-hidden="true" />{label}</button>)}</div>
      <p role="status" className="mt-3 flex items-center gap-1 text-xs text-slate-400"><Check size={13} aria-hidden="true" />{message}</p>
    </aside>
  </div>
}
