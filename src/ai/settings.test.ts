// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { canUseAi, isLocalAiEndpoint, loadAiSettings, saveAiSettings } from './settings'

afterEach(() => {
  localStorage.removeItem('apexpad-ai-settings')
})

describe('AI settings helpers', () => {
  it('detects local endpoints', () => {
    expect(isLocalAiEndpoint('http://localhost:11434/v1')).toBe(true)
    expect(isLocalAiEndpoint('http://127.0.0.1:11434/v1')).toBe(true)
    expect(isLocalAiEndpoint('https://api.groq.com/openai/v1')).toBe(false)
  })

  it('allows AI without a key when base URL is local Ollama', () => {
    saveAiSettings({
      apiKey: '',
      model: 'llama3.2',
      baseUrl: 'http://localhost:11434/v1',
    })
    expect(canUseAi()).toBe(true)
    expect(loadAiSettings().model).toBe('llama3.2')
  })

  it('requires a key for cloud endpoints', () => {
    saveAiSettings({
      apiKey: '',
      model: 'llama-3.1-8b-instant',
      baseUrl: 'https://api.groq.com/openai/v1',
    })
    expect(canUseAi()).toBe(false)

    saveAiSettings({
      apiKey: 'gsk_test',
      model: 'llama-3.1-8b-instant',
      baseUrl: 'https://api.groq.com/openai/v1',
    })
    expect(canUseAi()).toBe(true)
  })
})
