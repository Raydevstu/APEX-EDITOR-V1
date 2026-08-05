export type AiRewriteMode = 'grammar' | 'clearer' | 'shorter' | 'professional'

export type AiSummarizeMode = 'summary' | 'key-points' | 'action-items'

export type AiMode = AiRewriteMode | AiSummarizeMode | 'ask'

export interface AiSettings {
  apiKey: string
  model: string
  baseUrl: string
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiSourceNote {
  tabId: string
  title: string
  snippet: string
}

export interface AiTextResult {
  mode: AiMode
  text: string
  sources?: AiSourceNote[]
}

export interface EditorSelectionSnapshot {
  tabId: string
  from: number
  to: number
  text: string
}
