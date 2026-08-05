import { X } from 'lucide-react'
import { useModalFocus } from '../hooks/useModalFocus'
import { useEditorStore } from '../store/useEditorStore'

export function DiffViewer({ onClose }: { onClose: () => void }) {
  const state = useEditorStore()
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId)
  const current = activeTab?.content ?? ''
  const previous = state.snapshots.find((snapshot) => snapshot.tabId === state.activeTabId)?.content ?? ''
  const currentLines = current.split('\n')
  const previousLines = previous.split('\n')
  const max = Math.max(currentLines.length, previousLines.length)
  const dialogRef = useModalFocus(onClose)
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="diff-title"><section ref={dialogRef} className="w-full max-w-4xl rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 id="diff-title" className="text-base font-semibold">Latest snapshot diff</h2><button onClick={onClose} aria-label="Close diff"><X size={18} /></button></div><div aria-label={`Snapshot diff for ${activeTab?.title || 'Untitled Note'}`} role="region" className="max-h-[60vh] overflow-auto rounded-md border border-slate-800 font-mono text-xs">{Array.from({ length: max }, (_, index) => { const oldLine = previousLines[index] ?? ''; const newLine = currentLines[index] ?? ''; const changed = oldLine !== newLine; return <div key={index} className={changed ? 'bg-amber-500/10' : ''}><span className="inline-block w-10 select-none px-2 text-right text-slate-400">{index + 1}</span><span className={changed ? 'text-amber-200' : 'text-slate-400'}>{changed ? `${oldLine ? `- ${oldLine}` : ''}${oldLine && newLine ? '  ' : ''}${newLine ? `+ ${newLine}` : ''}` : newLine}</span></div> })}</div></section></div>
}
