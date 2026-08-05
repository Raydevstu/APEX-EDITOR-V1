import { afterEach, describe, expect, it, vi } from 'vitest'
import { AiClientError, completeChat } from './client'
import type { AiSettings } from './types'

const settings: AiSettings = {
  apiKey: 'test-key',
  model: 'llama-3.3-70b-versatile',
  baseUrl: 'https://api.groq.com/openai/v1',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('completeChat', () => {
  it('requires an API key for cloud endpoints', async () => {
    await expect(
      completeChat({ ...settings, apiKey: '' }, [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(AiClientError)
  })

  it('allows empty key for local Ollama and still posts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({
          choices: [{ message: { content: 'ok' } }],
        }), { status: 200 }),
      ),
    )

    const text = await completeChat(
      { apiKey: '', model: 'llama3.2', baseUrl: 'http://localhost:11434/v1' },
      [{ role: 'user', content: 'hi' }],
    )
    expect(text).toBe('ok')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:11434/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer ollama' }),
      }),
    )
  })

  it('returns assistant content on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({
          choices: [{ message: { content: '  Hello from Grok  ' } }],
        }), { status: 200 }),
      ),
    )

    const text = await completeChat(settings, [{ role: 'user', content: 'hi' }])
    expect(text).toBe('Hello from Grok')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    )
  })

  it('maps 401 to a clear error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), { status: 401 }),
      ),
    )

    await expect(
      completeChat(settings, [{ role: 'user', content: 'hi' }]),
    ).rejects.toMatchObject({ name: 'AiClientError', status: 401 })
  })

  it('surfaces 400 model errors from the provider body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: 'Model not found: grok-4.5' } }), { status: 400 }),
      ),
    )

    await expect(
      completeChat(settings, [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(/Model not found/i)
  })

  it('rejects empty model content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), { status: 200 }),
      ),
    )

    await expect(
      completeChat(settings, [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(/empty response/i)
  })
})
