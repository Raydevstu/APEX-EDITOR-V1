import { useEffect, useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { setEditorSelection } from '../ai/editorSelection'
import { useEditorStore } from '../store/useEditorStore'
import { apexThemeFor } from '../editor/apexTheme'

export function EditorCanvas() {
  const { tabs, activeTabId, setContent, theme, isZenMode, isCommandPaletteOpen, isHydrated } = useEditorStore()
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const content = activeTab?.content ?? ''
  const viewRef = useRef<EditorView | null>(null)
  const activeTabIdRef = useRef(activeTabId)
  activeTabIdRef.current = activeTabId

  const extensions = useMemo(() => {
    const language = content.trim().startsWith('{') || content.trim().startsWith('[') ? [json()] : [markdown()]
    return [
      ...language,
      apexThemeFor(theme === 'dark'),
      EditorView.contentAttributes.of({ 'aria-label': 'Note editor' }),
      // Capture selection so AI rewrite still works after the command palette steals focus.
      EditorView.updateListener.of((update) => {
        if (!update.selectionSet && !update.focusChanged && !update.docChanged) return
        const sel = update.state.selection.main
        const text = update.state.sliceDoc(sel.from, sel.to)
        setEditorSelection({
          tabId: activeTabIdRef.current,
          from: sel.from,
          to: sel.to,
          text,
        })
      }),
    ]
  }, [content, theme])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') { event.preventDefault(); useEditorStore.getState().addTab() }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') { event.preventDefault(); useEditorStore.getState().closeTab(activeTabId) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId])

  useEffect(() => {
    if (!isHydrated) return
    if (isCommandPaletteOpen) return
    if (document.querySelector('[role="dialog"]')) return

    const focusEditor = () => {
      // Never steal focus from chrome, modals, or other controls the user already chose.
      const active = document.activeElement as HTMLElement | null
      if (
        active
        && active !== document.body
        && active !== document.documentElement
        && !active.closest('.cm-editor')
      ) {
        return
      }
      const view = viewRef.current
      if (view) {
        view.focus()
        return
      }
      document.querySelector<HTMLElement>('.cm-content')?.focus()
    }

    // Wait a tick so CodeMirror can mount after tab switches / hydrate.
    const timer = window.setTimeout(focusEditor, 0)
    return () => window.clearTimeout(timer)
  }, [activeTabId, isCommandPaletteOpen, isHydrated])

  const stats = { lines: content.split('\n').length, words: content.trim() ? content.trim().split(/\s+/).length : 0, chars: content.length }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-cm-bg">
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          value={content}
          height="100%"
          theme="none"
          extensions={extensions}
          onChange={setContent}
          onCreateEditor={(view) => { viewRef.current = view }}
          basicSetup={{ lineNumbers: !isZenMode, foldGutter: false, highlightActiveLine: true }}
          className="h-full text-sm"
        />
      </div>
      {!isZenMode && (
        <footer className="flex h-8 shrink-0 items-center justify-between border-t border-hairline bg-surface/60 px-4 font-mono text-[11px] tabular-nums text-text-muted">
          <span>Lines: {stats.lines} · Words: {stats.words} · Characters: {stats.chars}</span>
          <span>{activeTab?.id.slice(0, 8)}</span>
        </footer>
      )}
    </section>
  )
}
