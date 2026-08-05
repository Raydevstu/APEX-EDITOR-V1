import { GitCompare } from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'
import { Dialog } from '../ui/Dialog'

export function DiffViewer({ onClose }: { onClose: () => void }) {
  const state = useEditorStore()
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId)
  const current = activeTab?.content ?? ''
  const previous = state.snapshots.find((snapshot) => snapshot.tabId === state.activeTabId)?.content ?? ''
  const currentLines = current.split('\n')
  const previousLines = previous.split('\n')
  const max = Math.max(currentLines.length, previousLines.length)

  return (
    <Dialog
      open
      onClose={onClose}
      title="Latest snapshot diff"
      titleId="diff-title"
      icon={<GitCompare size={16} className="text-text-muted" aria-hidden="true" />}
      closeLabel="Close diff"
      maxWidth="max-w-4xl"
    >
      <div
        aria-label={`Snapshot diff for ${activeTab?.title || 'Untitled Note'}`}
        role="region"
        className="max-h-[60vh] overflow-auto rounded-md border border-border font-mono text-xs leading-relaxed"
      >
        {Array.from({ length: max }, (_, index) => {
          const oldLine = previousLines[index] ?? ''
          const newLine = currentLines[index] ?? ''
          const changed = oldLine !== newLine
          return (
            <div key={index} className={`flex px-2 ${changed ? 'bg-warning-soft/50' : ''}`}>
              <span className="w-10 shrink-0 select-none pr-2 text-right tabular-nums text-text-faint">{index + 1}</span>
              <span className={`whitespace-pre-wrap ${changed ? 'text-warning' : 'text-text-secondary'}`}>
                {changed ? `${oldLine ? `- ${oldLine}` : ''}${oldLine && newLine ? '  ' : ''}${newLine ? `+ ${newLine}` : ''}` : newLine}
              </span>
            </div>
          )
        })}
      </div>
    </Dialog>
  )
}
