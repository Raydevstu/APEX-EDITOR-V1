import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendAiBlock, replaceRange, runAskNotes, runRewrite, runSummarize } from './actions'
import * as client from './client'
import * as settings from './settings'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('text helpers', () => {
  it('replaceRange swaps a mid-string span', () => {
    expect(replaceRange('hello world', 6, 11, 'Apex')).toBe('hello Apex')
  })

  it('appendAiBlock adds a markdown section', () => {
    expect(appendAiBlock('Body text', 'AI summary', 'Short.')).toBe(
      'Body text\n\n## AI summary\n\nShort.\n',
    )
    expect(appendAiBlock('', 'AI summary', 'Only')).toBe('## AI summary\n\nOnly\n')
  })
})

describe('run* actions', () => {
  it('runRewrite rejects empty input', async () => {
    await expect(runRewrite('grammar', '  ')).rejects.toThrow(/select some text/i)
  })

  it('runSummarize rejects empty notes', async () => {
    await expect(runSummarize('summary', 'T', '')).rejects.toThrow(/empty/i)
  })

  it('runRewrite returns model text', async () => {
    vi.spyOn(settings, 'loadAiSettings').mockReturnValue({
      apiKey: 'k',
      model: 'llama-3.3-70b-versatile',
      baseUrl: 'https://api.groq.com/openai/v1',
    })
    vi.spyOn(client, 'completeChat').mockResolvedValue('Fixed text.')

    const result = await runRewrite('grammar', 'Fixd text.')
    expect(result).toEqual({ mode: 'grammar', text: 'Fixed text.' })
    expect(client.completeChat).toHaveBeenCalled()
  })

  it('runAskNotes includes sources from retrieval', async () => {
    vi.spyOn(settings, 'loadAiSettings').mockReturnValue({
      apiKey: 'k',
      model: 'llama-3.3-70b-versatile',
      baseUrl: 'https://api.groq.com/openai/v1',
    })
    vi.spyOn(client, 'completeChat').mockResolvedValue('You wrote about milk in Groceries.')

    const result = await runAskNotes('milk', [
      { id: '1', title: 'Groceries', content: 'buy milk', updatedAt: 1 },
    ])
    expect(result.mode).toBe('ask')
    expect(result.text).toContain('milk')
    expect(result.sources?.some((source) => source.tabId === '1')).toBe(true)
  })
})
