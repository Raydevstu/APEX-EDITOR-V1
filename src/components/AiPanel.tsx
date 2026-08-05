import { Loader2, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendAiBlock,
  replaceRange,
  runAskNotes,
  runRewrite,
  runSummarize,
  summarizeHeading,
} from '../ai/actions'
import { getEditorSelection } from '../ai/editorSelection'
import { canUseAi, loadAiSettings } from '../ai/settings'
import type { AiRewriteMode, AiSourceNote, AiSummarizeMode } from '../ai/types'
import { useEditorStore } from '../store/useEditorStore'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export type AiPanelRequest =
  | { kind: 'rewrite'; mode: AiRewriteMode }
  | { kind: 'summarize'; mode: AiSummarizeMode }
  | { kind: 'ask'; question?: string }

export function AiPanel({
  request,
  onClose,
  onNeedSettings,
}: {
  request: AiPanelRequest
  onClose: () => void
  onNeedSettings: () => void
}) {
  const tabs = useEditorStore((state) => state.tabs)
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const setContent = useEditorStore((state) => state.setContent)
  const setActiveTab = useEditorStore((state) => state.setActiveTab)
  const takeSnapshot = useEditorStore((state) => state.takeSnapshot)

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const [question, setQuestion] = useState(request.kind === 'ask' ? (request.question ?? '') : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resultText, setResultText] = useState('')
  const [sources, setSources] = useState<AiSourceNote[]>([])
  const [applied, setApplied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  /** Capture selection once when rewrite panel opens (before any re-render). */
  const selectionRef = useRef(request.kind === 'rewrite' ? getEditorSelection() : null)

  const title =
    request.kind === 'rewrite'
      ? rewriteTitle(request.mode)
      : request.kind === 'summarize'
        ? summarizeTitle(request.mode)
        : 'Ask your notes'

  const ensureKey = useCallback(() => {
    if (canUseAi()) return true
    const { baseUrl } = loadAiSettings()
    const isLocal = /localhost|127\.0\.0\.1/i.test(baseUrl)
    setError(
      isLocal
        ? 'Local AI is not ready. In AI settings click “Ollama (free local)” then Save. Model must match `ollama list` (e.g. llama3.2).'
        : 'No API key saved. Open AI settings → pick Groq preset → paste free key → Save.',
    )
    onNeedSettings()
    return false
  }, [onNeedSettings])

  const run = useCallback(async () => {
    if (!ensureKey()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError('')
    setApplied(false)
    setResultText('')
    setSources([])

    try {
      if (request.kind === 'rewrite') {
        const sel = selectionRef.current
        const text =
          sel && sel.tabId === activeTabId && sel.text.trim()
            ? sel.text
            : (activeTab?.content ?? '')
        const result = await runRewrite(request.mode, text, { signal: controller.signal })
        setResultText(result.text)
      } else if (request.kind === 'summarize') {
        const result = await runSummarize(
          request.mode,
          activeTab?.title ?? '',
          activeTab?.content ?? '',
          { signal: controller.signal },
        )
        setResultText(result.text)
      } else {
        const result = await runAskNotes(question, tabs, { signal: controller.signal })
        setResultText(result.text)
        setSources(result.sources ?? [])
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'AI request failed.')
    } finally {
      setBusy(false)
    }
  }, [activeTab?.content, activeTab?.title, activeTabId, ensureKey, question, request, tabs])

  // Auto-run rewrite/summarize; ask waits for submit.
  useEffect(() => {
    if (request.kind === 'ask') return
    void run()
    return () => {
      abortRef.current?.abort()
    }
    // Only on mount for this request identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => {
    abortRef.current?.abort()
  }, [])

  const applyRewrite = async () => {
    if (!resultText || !activeTab) return
    await takeSnapshot()
    const sel = selectionRef.current
    if (sel && sel.tabId === activeTabId && sel.from !== sel.to) {
      setContent(replaceRange(activeTab.content, sel.from, sel.to, resultText))
    } else {
      setContent(resultText)
    }
    setApplied(true)
  }

  const insertSummary = async () => {
    if (!resultText || !activeTab || request.kind !== 'summarize') return
    await takeSnapshot()
    const heading = summarizeHeading(request.mode)
    setContent(appendAiBlock(activeTab.content, heading, resultText))
    setApplied(true)
  }

  const insertAskAnswer = async () => {
    if (!resultText || !activeTab) return
    await takeSnapshot()
    setContent(appendAiBlock(activeTab.content, 'AI answer', resultText))
    setApplied(true)
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      titleId="ai-panel-title"
      icon={<Sparkles size={16} className="text-text-muted" aria-hidden="true" />}
      closeLabel="Close AI panel"
      maxWidth="max-w-xl"
    >
      {request.kind === 'ask' && (
        <form
          className="mb-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            void run()
          }}
        >
          <input
            autoFocus
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What did I write about…?"
            aria-label="Ask your notes"
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-canvas px-3 text-sm outline-none placeholder:text-text-faint focus:border-accent"
          />
          <Button type="submit" variant="primary" loading={busy} disabled={!question.trim()}>
            Ask
          </Button>
        </form>
      )}

      {request.kind === 'rewrite' && (
        <p className="mb-3 text-xs text-text-muted">
          {selectionRef.current?.tabId === activeTabId && selectionRef.current.text.trim()
            ? `Rewriting selection (${selectionRef.current.text.length} characters). Snapshot taken before apply.`
            : 'No selection — rewriting the whole note. Snapshot taken before apply.'}
        </p>
      )}

      {busy && (
        <p className="mb-3 flex items-center gap-2 text-sm text-text-secondary" role="status">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          Working…
        </p>
      )}

      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}

      {resultText && (
        <>
          <textarea
            readOnly
            value={resultText}
            aria-label="AI result"
            className="mb-3 h-48 w-full resize-y rounded-md border border-border bg-canvas p-3 text-sm text-text-primary"
          />

          {sources.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Sources</p>
              <ul className="space-y-1">
                {sources.map((source) => (
                  <li key={source.tabId}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(source.tabId)
                        onClose()
                      }}
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      <span className="block truncate font-medium">{source.title}</span>
                      {source.snippet && (
                        <span className="block truncate text-xs text-text-muted">{source.snippet}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {request.kind === 'rewrite' && (
              <Button variant="primary" onClick={() => void applyRewrite()} disabled={applied}>
                {applied ? 'Applied' : 'Replace in note'}
              </Button>
            )}
            {request.kind === 'summarize' && (
              <Button variant="primary" onClick={() => void insertSummary()} disabled={applied}>
                {applied ? 'Inserted' : 'Insert below'}
              </Button>
            )}
            {request.kind === 'ask' && (
              <Button variant="secondary" onClick={() => void insertAskAnswer()} disabled={applied}>
                {applied ? 'Inserted' : 'Insert answer'}
              </Button>
            )}
            {(request.kind === 'rewrite' || request.kind === 'summarize') && (
              <Button variant="ghost" loading={busy} onClick={() => void run()}>
                Retry
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
          {applied && (
            <p role="status" className="mt-2 text-xs text-success">
              Applied. Use snapshots if you need to restore the previous version.
            </p>
          )}
        </>
      )}

      {!busy && !resultText && !error && request.kind !== 'ask' && (
        <p className="text-sm text-text-muted">Preparing request…</p>
      )}
    </Dialog>
  )
}

function rewriteTitle(mode: AiRewriteMode): string {
  switch (mode) {
    case 'grammar':
      return 'AI: Fix grammar'
    case 'clearer':
      return 'AI: Make clearer'
    case 'shorter':
      return 'AI: Make shorter'
    case 'professional':
      return 'AI: Professional tone'
  }
}

function summarizeTitle(mode: AiSummarizeMode): string {
  switch (mode) {
    case 'summary':
      return 'AI: Summarize note'
    case 'key-points':
      return 'AI: Key points'
    case 'action-items':
      return 'AI: Action items'
  }
}
