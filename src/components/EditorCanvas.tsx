import { useEffect, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { useEditorStore } from '../store/useEditorStore'

export function EditorCanvas() {
  const { tabs, activeTabId, setContent, theme, isZenMode } = useEditorStore()
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const content = activeTab?.content ?? ''
  const extensions = useMemo(() => {
    const language = content.trim().startsWith('{') || content.trim().startsWith('[') ? [json()] : [markdown()]
    return [
      ...language,
      EditorView.contentAttributes.of({ 'aria-label': 'Note editor' }),
    ]
  }, [content])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') { event.preventDefault(); useEditorStore.getState().addTab() }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') { event.preventDefault(); useEditorStore.getState().closeTab(activeTabId) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId])

  const stats = { lines: content.split('\n').length, words: content.trim() ? content.trim().split(/\s+/).length : 0, chars: content.length }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-950">
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror value={content} height="100%" theme={theme === 'light' ? 'light' : oneDark} extensions={extensions} onChange={setContent} basicSetup={{ lineNumbers: !isZenMode, foldGutter: false, highlightActiveLine: true }} className="h-full text-sm" />
      </div>
      {!isZenMode && <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-800 bg-slate-900/50 px-4 font-mono text-[11px] text-slate-400"><span>Lines: {stats.lines} · Words: {stats.words} · Characters: {stats.chars}</span><span>{activeTab?.id.slice(0, 8)}</span></footer>}
    </section>
  )
}
