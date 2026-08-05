import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import {
  AI_PROVIDER_PRESETS,
  clearAiApiKey,
  DEFAULT_AI_SETTINGS,
  loadAiSettings,
  saveAiSettings,
  type AiProviderPreset,
} from '../ai/settings'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export function AiSettingsModal({ onClose }: { onClose: () => void }) {
  const initial = loadAiSettings()
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [model, setModel] = useState(initial.model)
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl)
  const [status, setStatus] = useState('')

  /** Apply preset and persist immediately so Fix grammar works without a second Save. */
  const applyPreset = (preset: AiProviderPreset) => {
    const nextKey = preset.keyOptional
      ? (apiKey.trim() || 'ollama')
      : apiKey
    const next = {
      apiKey: nextKey,
      model: preset.model,
      baseUrl: preset.baseUrl,
    }
    setBaseUrl(next.baseUrl)
    setModel(next.model)
    setApiKey(next.apiKey)
    saveAiSettings(next)

    if (preset.keyOptional) {
      setStatus(
        `Saved ${preset.label}. Model “${preset.model}” must appear in \`ollama list\`. Retry Fix grammar.`,
      )
    } else if (next.apiKey.trim()) {
      setStatus(`Saved ${preset.label} with your existing key. Retry Fix grammar.`)
    } else {
      setStatus(
        `Applied ${preset.label}. Paste your API key below and click Save (required for cloud).`,
      )
    }
  }

  const save = () => {
    saveAiSettings({ apiKey, model, baseUrl })
    const local = /localhost|127\.0\.0\.1/i.test(baseUrl)
    if (local) {
      setStatus('Saved. Local Ollama needs no real key — retry Fix grammar.')
    } else if (apiKey.trim()) {
      setStatus('Saved. Key stays in this browser only.')
    } else {
      setStatus('Saved, but cloud providers need an API key before AI commands work.')
    }
  }

  const clearKey = () => {
    clearAiApiKey()
    setApiKey('')
    setStatus('API key cleared from this browser.')
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="AI settings"
      titleId="ai-settings-title"
      icon={<KeyRound size={16} className="text-text-muted" aria-hidden="true" />}
      closeLabel="Close AI settings"
      maxWidth="max-w-xl"
    >
      <p className="mb-3 text-xs text-text-muted">
        Any OpenAI-compatible chat API works. Key stays in this browser and is only sent when you run an AI command.
      </p>

      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">Presets (click applies + saves)</p>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {AI_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset)}
            className="rounded-md border border-border bg-canvas px-3 py-2 text-left transition-colors hover:border-accent/40 hover:bg-surface-hover"
          >
            <span className="block text-sm font-medium text-text-primary">{preset.label}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-text-muted">{preset.description}</span>
          </button>
        ))}
      </div>

      <label htmlFor="ai-api-key" className="mb-1 block text-xs font-medium text-text-secondary">
        API key
      </label>
      <input
        id="ai-api-key"
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        placeholder="Cloud: paste key · Ollama: ollama"
        className="mb-3 h-9 w-full rounded-md border border-border bg-canvas px-3 text-sm text-text-primary outline-none placeholder:text-text-faint focus:border-accent"
      />

      <label htmlFor="ai-model" className="mb-1 block text-xs font-medium text-text-secondary">
        Model <span className="font-normal text-text-muted">(must match provider exactly)</span>
      </label>
      <input
        id="ai-model"
        value={model}
        onChange={(event) => setModel(event.target.value)}
        placeholder={DEFAULT_AI_SETTINGS.model}
        className="mb-3 h-9 w-full rounded-md border border-border bg-canvas px-3 text-sm text-text-primary outline-none placeholder:text-text-faint focus:border-accent"
      />

      <label htmlFor="ai-base-url" className="mb-1 block text-xs font-medium text-text-secondary">
        Base URL
      </label>
      <input
        id="ai-base-url"
        value={baseUrl}
        onChange={(event) => setBaseUrl(event.target.value)}
        placeholder={DEFAULT_AI_SETTINGS.baseUrl}
        className="mb-4 h-9 w-full rounded-md border border-border bg-canvas px-3 font-mono text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-accent"
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={save}>Save</Button>
        <Button variant="secondary" onClick={clearKey} disabled={!apiKey && !loadAiSettings().apiKey}>Clear key</Button>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>

      {status && <p role="status" className="mt-3 text-xs text-text-secondary">{status}</p>}

      <div className="mt-4 space-y-2 border-t border-hairline pt-3 text-[11px] leading-relaxed text-text-muted">
        <p>
          <strong className="text-text-secondary">Groq blocked 70B?</strong> Use model{' '}
          <code className="text-text-secondary">llama-3.1-8b-instant</code> (default preset). Or enable models at{' '}
          <a className="text-accent underline-offset-2 hover:underline" href="https://console.groq.com/settings/limits" target="_blank" rel="noreferrer">
            console.groq.com/settings/limits
          </a>
          .
        </p>
        <p>
          <strong className="text-text-secondary">Ollama:</strong> run <code className="text-text-secondary">ollama list</code> — Model field must match the NAME column exactly (e.g. <code className="text-text-secondary">llama3.2</code>, not <code className="text-text-secondary">lamma3.2</code>).
        </p>
      </div>
    </Dialog>
  )
}
