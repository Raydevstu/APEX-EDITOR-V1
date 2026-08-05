import type { Tab } from '../types/notepad'
import { completeChat } from './client'
import {
  askNotesSystemPrompt,
  buildAskUserPrompt,
  rewriteSystemPrompt,
  summarizeSystemPrompt,
} from './prompts'
import { packRetrievedNotes, retrieveNotesForQuestion, toAiSources } from './retrieval'
import { loadAiSettings } from './settings'
import type { AiRewriteMode, AiSummarizeMode, AiTextResult } from './types'

const MAX_INPUT_CHARS = 24_000

function clampInput(text: string): string {
  if (text.length <= MAX_INPUT_CHARS) return text
  return `${text.slice(0, MAX_INPUT_CHARS)}\n\n[…truncated for AI context…]`
}

export async function runRewrite(
  mode: AiRewriteMode,
  text: string,
  options?: { signal?: AbortSignal },
): Promise<AiTextResult> {
  const input = text.trim()
  if (!input) {
    throw new Error('Select some text (or put content in the note) to rewrite.')
  }

  const settings = loadAiSettings()
  const result = await completeChat(
    settings,
    [
      { role: 'system', content: rewriteSystemPrompt(mode) },
      { role: 'user', content: clampInput(input) },
    ],
    { temperature: 0.2, maxTokens: 2048, signal: options?.signal },
  )

  return { mode, text: result }
}

export async function runSummarize(
  mode: AiSummarizeMode,
  noteTitle: string,
  noteContent: string,
  options?: { signal?: AbortSignal },
): Promise<AiTextResult> {
  const content = noteContent.trim()
  if (!content) {
    throw new Error('This note is empty — nothing to summarize.')
  }

  const settings = loadAiSettings()
  const user = `Title: ${noteTitle || 'Untitled Note'}\n\n${clampInput(content)}`
  const result = await completeChat(
    settings,
    [
      { role: 'system', content: summarizeSystemPrompt(mode) },
      { role: 'user', content: user },
    ],
    { temperature: 0.3, maxTokens: 1024, signal: options?.signal },
  )

  return { mode, text: result }
}

export async function runAskNotes(
  question: string,
  tabs: Tab[],
  options?: { signal?: AbortSignal },
): Promise<AiTextResult> {
  const q = question.trim()
  if (!q) {
    throw new Error('Enter a question about your notes.')
  }
  if (tabs.length === 0) {
    throw new Error('No notes to search.')
  }

  const retrieved = retrieveNotesForQuestion(tabs, q)
  const packed = packRetrievedNotes(retrieved)
  const settings = loadAiSettings()
  const result = await completeChat(
    settings,
    [
      { role: 'system', content: askNotesSystemPrompt() },
      { role: 'user', content: buildAskUserPrompt(q, packed) },
    ],
    { temperature: 0.2, maxTokens: 1024, signal: options?.signal },
  )

  return {
    mode: 'ask',
    text: result,
    sources: toAiSources(retrieved),
  }
}

export function summarizeHeading(mode: AiSummarizeMode): string {
  switch (mode) {
    case 'summary':
      return 'AI summary'
    case 'key-points':
      return 'AI key points'
    case 'action-items':
      return 'AI action items'
  }
}

/** Append a markdown result block under existing note content. */
export function appendAiBlock(existing: string, heading: string, body: string): string {
  const block = `## ${heading}\n\n${body.trim()}`
  const base = existing.replace(/\s+$/, '')
  return base ? `${base}\n\n${block}\n` : `${block}\n`
}

/** Replace a character range in note content (CodeMirror offsets). */
export function replaceRange(content: string, from: number, to: number, replacement: string): string {
  const start = Math.max(0, Math.min(from, content.length))
  const end = Math.max(start, Math.min(to, content.length))
  return content.slice(0, start) + replacement + content.slice(end)
}
