import { Clock3, History, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'

export function SnapshotModal({ onClose }: { onClose: () => void }) {
  const allSnapshots = useEditorStore((state) => state.snapshots)
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const restoreSnapshot = useEditorStore((state) => state.restoreSnapshot)
  const snapshots = useMemo(() => allSnapshots.filter((snapshot) => snapshot.tabId === activeTabId), [activeTabId, allSnapshots])

  return (
    <Dialog open onClose={onClose} title="Snapshot history" titleId="snapshot-title" icon={<History size={16} className="text-text-muted" aria-hidden="true" />} closeLabel="Close snapshots">
      {snapshots.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-text-muted">No snapshots for this note yet.</p>
          <p className="mt-1 text-xs text-text-muted">Create one from the header anytime to save a restore point.</p>
        </div>
      ) : (
        <div className="max-h-80 space-y-2 overflow-auto">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-surfaceHover">
              <div className="min-w-0">
                <p className="truncate text-sm text-text-primary">{snapshot.title}</p>
                <p className="flex items-center gap-1 text-xs text-text-muted"><Clock3 size={12} aria-hidden="true" />{new Date(snapshot.timestamp).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { restoreSnapshot(snapshot.id); onClose() }}>
                <RotateCcw size={13} aria-hidden="true" />
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  )
}
