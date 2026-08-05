import { Clock3, RotateCcw, X } from 'lucide-react'
import { useMemo } from 'react'
import { useModalFocus } from '../hooks/useModalFocus'
import { useEditorStore } from '../store/useEditorStore'

export function SnapshotModal({ onClose }: { onClose: () => void }) {
  const allSnapshots = useEditorStore((state) => state.snapshots)
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const restoreSnapshot = useEditorStore((state) => state.restoreSnapshot)
  const dialogRef = useModalFocus(onClose)
  const snapshots = useMemo(() => allSnapshots.filter((snapshot) => snapshot.tabId === activeTabId), [activeTabId, allSnapshots])

  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
    <section ref={dialogRef} className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 id="snapshot-title" className="text-base font-semibold">Snapshot history</h2><button onClick={onClose} aria-label="Close snapshots"><X size={18} /></button></div>
      {snapshots.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No snapshots for this note yet.</p> : <div className="max-h-80 space-y-2 overflow-auto">{snapshots.map((snapshot) => <div key={snapshot.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2"><div><p className="text-sm text-slate-200">{snapshot.title}</p><p className="flex items-center gap-1 text-xs text-slate-500"><Clock3 size={12} />{new Date(snapshot.timestamp).toLocaleString()}</p></div><button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-indigo-300 hover:bg-indigo-500/10" onClick={() => { restoreSnapshot(snapshot.id); onClose() }}><RotateCcw size={13} />Restore</button></div>)}</div>}
    </section></div>
}
