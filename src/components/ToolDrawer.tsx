import { Braces, Check, ListX, Rows3 } from 'lucide-react'
import { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { processText } from '../utils/workerManager'
import type { TextTool } from '../utils/textTools'
import { Dialog } from '../ui/Dialog'

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
  const run = async (tool: TextTool) => { try { setContent(await processText(tool, content)); setMessage('Applied successfully') } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not apply tool') } }

  return (
    <Dialog open onClose={onClose} title="Text tools" titleId="tool-drawer-title" placement="right" closeLabel="Close text tools">
      <div className="space-y-1">
        {tools.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => void run(id)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-text-secondary transition-colors duration-150 hover:bg-surfaceHover hover:text-text-primary focus-visible:bg-surfaceHover"
          >
            <Icon size={16} aria-hidden="true" className="text-text-muted" />
            {label}
          </button>
        ))}
      </div>
      <p role="status" className="mt-3 flex items-center gap-1.5 border-t border-hairline pt-3 text-xs text-text-muted">
        <Check size={13} aria-hidden="true" className="text-success" />
        {message}
      </p>
    </Dialog>
  )
}
