import type { AiChatMessage, ResolvedAiSettings } from './types'

export class AiClientError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AiClientError'
    this.status = status
  }
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>
  error?: { message?: string }
}

/**
 * Minimal SpaceXAI / xAI chat-completions client (OpenAI-compatible).
 * Uses fetch only — no SDK — so the offline-first SPA stays dependency-light.
 * Calls are user-initiated; core editing never requires this path.
 *
 * Caller must pass a resolved key (from resolveAiSettingsForClient). Never load secrets here.
 */
export async function completeChat(
  settings: ResolvedAiSettings,
  messages: AiChatMessage[],
  options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal },
): Promise<string> {
  const baseUrl = (settings.baseUrl || 'https://api.x.ai/v1').replace(/\/$/, '')
  const model = settings.model.trim() || 'grok-4-1-fast-non-reasoning'
  const isLocal =
    /localhost|127\.0\.0\.1|\[::1\]/i.test(baseUrl)

  // Local servers (Ollama) ignore the key; cloud providers require one.
  const apiKey = settings.apiKey.trim() || (isLocal ? 'ollama' : '')
  if (!apiKey) {
    throw new AiClientError(
      'Add an API key in AI settings (stored in Vault). For free cloud: use the Groq preset. For local: use the Ollama preset and Save.',
    )
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 2048,
        stream: false,
      }),
      signal: options?.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new AiClientError(
      isLocal
        ? 'Cannot reach Ollama at localhost:11434. Run `ollama serve`, confirm `ollama list` shows your model, and that Model in AI settings matches exactly (e.g. llama3.2).'
        : 'Network error talking to the AI provider. Check your connection and try again.',
    )
  }

  let body: ChatCompletionResponse = {}
  let rawText = ''
  try {
    rawText = await response.text()
    body = rawText ? (JSON.parse(rawText) as ChatCompletionResponse) : {}
  } catch {
    // Non-JSON error body.
  }

  if (!response.ok) {
    const detail = body.error?.message?.trim() || rawText.slice(0, 280).trim()
    if (response.status === 401) {
      throw new AiClientError(detail || 'API key rejected. Check AI settings / vault secret.', 401)
    }
    if (response.status === 429) {
      throw new AiClientError(detail || 'Rate limited by the AI provider. Try again shortly.', 429)
    }
    if (response.status === 400) {
      throw new AiClientError(
        detail
          || `Bad request (400). Model “${model}” may be wrong for this provider, or the account has no credits. Try the Groq preset in AI settings.`,
        400,
      )
    }
    throw new AiClientError(detail || `AI request failed (${response.status}).`, response.status)
  }

  const text = body.choices?.[0]?.message?.content?.trim()
  if (!text) {
    throw new AiClientError('The AI returned an empty response.')
  }
  return text
}
