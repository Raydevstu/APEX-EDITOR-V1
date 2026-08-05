import {
  FilePlus2,
  FileText,
  History,
  KeyRound,
  ListChecks,
  ListTree,
  Scissors,
  Search,
  Sparkles,
  WandSparkles,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent, type RefObject } from 'react'
import type { AiPanelRequest } from './AiPanel'
import type { AiRewriteMode, AiSummarizeMode } from '../ai/types'
import { useEditorStore } from '../store/useEditorStore'
import { searchNotes } from '../utils/searchNotes'
import { Dialog } from '../ui/Dialog'

type ListItem =
  | { kind: 'note'; id: string; label: string; hint: string; run: () => void }
  | { kind: 'command'; id: string; label: string; hint: string; group: 'commands' | 'ai'; run: () => void }

type CommandDef = {
  id: string
  label: string
  hint: string
  group: 'commands' | 'ai'
  keywords?: string
  action: () => void
}

export function CommandPalette({
  onTools,
  onSnapshots,
  onAi,
  onAiSettings,
  onSnip,
  returnFocusRef,
}: {
  onTools: () => void
  onSnapshots: () => void
  onAi: (request: AiPanelRequest) => void
  onAiSettings: () => void
  onSnip: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const tabs = useEditorStore((state) => state.tabs)
  const addTab = useEditorStore((state) => state.addTab)
  const setActiveTab = useEditorStore((state) => state.setActiveTab)
  const setOpen = useEditorStore((state) => state.setCommandPaletteOpen)

  const noteHits = useMemo(() => searchNotes(tabs, query), [tabs, query])

  const commands = useMemo(() => {
    const rewrite = (mode: AiRewriteMode, label: string): CommandDef => ({
      id: `ai-rewrite-${mode}`,
      label,
      hint: 'Selection or note',
      group: 'ai',
      keywords: 'ai rewrite improve',
      action: () => onAi({ kind: 'rewrite', mode }),
    })
    const summarize = (mode: AiSummarizeMode, label: string): CommandDef => ({
      id: `ai-summarize-${mode}`,
      label,
      hint: 'Active note',
      group: 'ai',
      keywords: 'ai summarize',
      action: () => onAi({ kind: 'summarize', mode }),
    })

    const all: CommandDef[] = [
      { id: 'new-note', label: 'New note', hint: 'Ctrl+T', group: 'commands', action: addTab },
      { id: 'tools', label: 'Open text tools', hint: '', group: 'commands', action: onTools },
      { id: 'snapshots', label: 'Open snapshots', hint: '', group: 'commands', action: onSnapshots },
      {
        id: 'snip',
        label: 'Snip → text (OCR)',
        hint: 'Ctrl+Shift+S',
        group: 'commands',
        keywords: 'snip screenshot ocr image paste clipboard capture',
        action: onSnip,
      },
      rewrite('grammar', 'AI: Fix grammar'),
      rewrite('clearer', 'AI: Make clearer'),
      rewrite('shorter', 'AI: Make shorter'),
      rewrite('professional', 'AI: Professional tone'),
      summarize('summary', 'AI: Summarize note'),
      summarize('key-points', 'AI: Key points'),
      summarize('action-items', 'AI: Action items'),
      {
        id: 'ai-ask',
        label: 'AI: Ask your notes…',
        hint: 'Q&A + sources',
        group: 'ai',
        keywords: 'ai ask search question what did i write',
        action: () => onAi({ kind: 'ask', question: query.startsWith('?') ? query.slice(1).trim() : '' }),
      },
      {
        id: 'ai-settings',
        label: 'AI settings…',
        hint: 'API key',
        group: 'ai',
        keywords: 'ai settings key model xai',
        action: onAiSettings,
      },
    ]

    // Natural-language ask: "?shipping timeline" or "what did I write about milk"
    const trimmed = query.trim()
    if (trimmed.startsWith('?') && trimmed.length > 1) {
      const question = trimmed.slice(1).trim()
      all.unshift({
        id: 'ai-ask-query',
        label: `Ask notes: ${question}`,
        hint: 'AI Q&A',
        group: 'ai',
        action: () => onAi({ kind: 'ask', question }),
      })
    }

    const normalized = query.trim().toLowerCase()
    if (!normalized || normalized.startsWith('?')) {
      // For bare "?" queries, only show AI ask helpers + ai commands that match.
      if (normalized.startsWith('?')) {
        return all.filter((command) => command.group === 'ai' && (command.id.startsWith('ai-ask') || command.id === 'ai-settings'))
      }
      return all
    }

    return all.filter((command) => {
      const haystack = `${command.label} ${command.keywords ?? ''} ${command.hint}`.toLowerCase()
      return haystack.includes(normalized)
    })
  }, [addTab, onAi, onAiSettings, onSnapshots, onSnip, onTools, query])

  const items: ListItem[] = useMemo(() => {
    const noteItems: ListItem[] = noteHits.map((hit) => ({
      kind: 'note',
      id: `note-${hit.tabId}`,
      label: hit.title,
      hint: hit.snippet,
      run: () => setActiveTab(hit.tabId),
    }))
    const commandItems: ListItem[] = commands.map((command) => ({
      kind: 'command',
      id: command.id,
      label: command.label,
      hint: command.hint,
      group: command.group,
      run: command.action,
    }))
    return [...noteItems, ...commandItems]
  }, [commands, noteHits, setActiveTab])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, items.length])

  useEffect(() => {
    if (selectedIndex >= items.length) setSelectedIndex(Math.max(0, items.length - 1))
  }, [items.length, selectedIndex])

  const closePalette = (restoreFocus: boolean) => {
    const target = restoreFocus ? (returnFocusRef?.current ?? null) : null
    setOpen(false)
    if (target) window.setTimeout(() => target.focus(), 0)
  }

  const runItem = (item: ListItem) => {
    const isNewNote = item.kind === 'command' && item.id === 'new-note'
    const isNote = item.kind === 'note'
    closePalette(!(isNewNote || isNote))
    item.run()
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (items.length === 0) return
      setSelectedIndex((index) => (index + 1) % items.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (items.length === 0) return
      setSelectedIndex((index) => (index - 1 + items.length) % items.length)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setSelectedIndex(0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      setSelectedIndex(Math.max(0, items.length - 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[selectedIndex]
      if (item) runItem(item)
    }
  }

  return (
    <Dialog
      open
      onClose={() => closePalette(true)}
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
          onKeyDown={onInputKeyDown}
          placeholder="Search notes, commands, or ?ask AI…"
          aria-label="Search notes and commands"
          aria-controls="command-palette-results"
          aria-activedescendant={items[selectedIndex] ? `palette-item-${items[selectedIndex].id}` : undefined}
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-text-faint"
        />
      </div>
      <div id="command-palette-results" role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-text-muted">No notes or commands match “{query}”.</p>
        ) : (
          items.map((item, index) => {
            const selected = index === selectedIndex
            const isNote = item.kind === 'note'
            const prev = items[index - 1]
            const showNotesHeader = isNote && index === 0
            const showCommandsHeader =
              item.kind === 'command'
              && item.group === 'commands'
              && (!prev || prev.kind === 'note' || (prev.kind === 'command' && prev.group !== 'commands'))
            const showAiHeader =
              item.kind === 'command'
              && item.group === 'ai'
              && (!prev || prev.kind === 'note' || (prev.kind === 'command' && prev.group !== 'ai'))

            return (
              <div key={item.id}>
                {showNotesHeader && (
                  <p className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Notes</p>
                )}
                {showCommandsHeader && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">Commands</p>
                )}
                {showAiHeader && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">AI assistant</p>
                )}
                <button
                  id={`palette-item-${item.id}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => runItem(item)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 focus-visible:bg-surfaceHover ${
                    selected ? 'bg-surfaceHover text-text-primary' : 'text-text-secondary hover:bg-surfaceHover hover:text-text-primary'
                  }`}
                >
                  <CommandIcon item={item} />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate">{item.label}</span>
                    {isNote && item.hint && (
                      <span className="block truncate text-xs text-text-muted">{item.hint}</span>
                    )}
                  </span>
                  {!isNote && item.hint && (
                    <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">{item.hint}</kbd>
                  )}
                </button>
              </div>
            )
          })
        )}
      </div>
    </Dialog>
  )
}

function CommandIcon({ item }: { item: ListItem }) {
  if (item.kind === 'note') {
    return <FileText size={16} aria-hidden="true" className="text-text-muted" />
  }
  const id = item.id
  if (id === 'new-note') return <FilePlus2 size={16} aria-hidden="true" className="text-text-muted" />
  if (id === 'tools') return <Wrench size={16} aria-hidden="true" className="text-text-muted" />
  if (id === 'snapshots') return <History size={16} aria-hidden="true" className="text-text-muted" />
  if (id === 'snip') return <Scissors size={16} aria-hidden="true" className="text-text-muted" />
  if (id === 'ai-settings') return <KeyRound size={16} aria-hidden="true" className="text-text-muted" />
  if (id.startsWith('ai-ask')) return <Sparkles size={16} aria-hidden="true" className="text-text-muted" />
  if (id.includes('action-items')) return <ListChecks size={16} aria-hidden="true" className="text-text-muted" />
  if (id.includes('key-points') || id.includes('summary')) return <ListTree size={16} aria-hidden="true" className="text-text-muted" />
  return <WandSparkles size={16} aria-hidden="true" className="text-text-muted" />
}
