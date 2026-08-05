import type { AiSettings } from './types'

const STORAGE_KEY = 'apexpad-ai-settings'

/** Default SpaceXAI (xAI) OpenAI-compatible endpoint and model. */
export const DEFAULT_AI_SETTINGS: Omit<AiSettings, 'apiKey'> = {
  model: 'grok-4-1-fast-non-reasoning',
  baseUrl: 'https://api.x.ai/v1',
}

/** One-click OpenAI-compatible providers (free tiers or local). */
export type AiProviderPresetId = 'xai' | 'groq' | 'ollama' | 'openrouter' | 'gemini'

export interface AiProviderPreset {
  id: AiProviderPresetId
  label: string
  description: string
  baseUrl: string
  model: string
  /** Placeholder / hint for the API key field */
  keyHint: string
  /** If true, any non-empty key works (local servers ignore auth). */
  keyOptional: boolean
  signupUrl?: string
}

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  {
    id: 'groq',
    label: 'Groq (free + very fast)',
    description: 'Free cloud. Uses llama-3.1-8b-instant (widely allowed). Paste free API key, then Save.',
    baseUrl: 'https://api.groq.com/openai/v1',
    // 70B is often org-blocked on free accounts; 8B instant is the free-tier workhorse.
    model: 'llama-3.1-8b-instant',
    keyHint: 'gsk_… from console.groq.com',
    keyOptional: false,
    signupUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'ollama',
    label: 'Ollama (free local)',
    description: 'Local PC. Click this, then Save (no real key needed). Model name must match `ollama list`.',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.2',
    keyHint: 'ollama (auto-filled; server ignores it)',
    keyOptional: true,
    signupUrl: 'https://ollama.com/download',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter (free models)',
    description: 'Many free models via one key. Use a :free model id.',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    keyHint: 'sk-or-… from openrouter.ai',
    keyOptional: false,
    signupUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'gemini',
    label: 'Google Gemini (free tier)',
    description: 'OpenAI-compatible Gemini endpoint. Get a key from AI Studio.',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    keyHint: 'AIza… from aistudio.google.com',
    keyOptional: false,
    signupUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'xai',
    label: 'xAI Grok (paid / credits)',
    description: 'Needs console credits. Prefer grok-4-1-fast-* over inventing model names.',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4-1-fast-non-reasoning',
    keyHint: 'xai-… from console.x.ai',
    keyOptional: false,
    signupUrl: 'https://console.x.ai',
  },
]

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { apiKey: '', ...DEFAULT_AI_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AiSettings>
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : DEFAULT_AI_SETTINGS.model,
      baseUrl: typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim()
        ? parsed.baseUrl.trim().replace(/\/$/, '')
        : DEFAULT_AI_SETTINGS.baseUrl,
    }
  } catch {
    return { apiKey: '', ...DEFAULT_AI_SETTINGS }
  }
}

export function saveAiSettings(settings: AiSettings): void {
  const payload: AiSettings = {
    apiKey: settings.apiKey.trim(),
    model: settings.model.trim() || DEFAULT_AI_SETTINGS.model,
    baseUrl: (settings.baseUrl.trim() || DEFAULT_AI_SETTINGS.baseUrl).replace(/\/$/, ''),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearAiApiKey(): void {
  const current = loadAiSettings()
  saveAiSettings({ ...current, apiKey: '' })
}

export function isLocalAiEndpoint(baseUrl: string): boolean {
  try {
    const host = new URL(baseUrl).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
  } catch {
    return /localhost|127\.0\.0\.1/i.test(baseUrl)
  }
}

/** Cloud providers need a key; local OpenAI-compatible servers (Ollama) do not. */
export function canUseAi(): boolean {
  const settings = loadAiSettings()
  if (settings.apiKey.trim()) return true
  return isLocalAiEndpoint(settings.baseUrl)
}

/** @deprecated use canUseAi — kept for call sites that only care about a stored key */
export function hasAiApiKey(): boolean {
  return canUseAi()
}
