import type { Tab } from '../types/notepad'
import { searchNotes } from '../utils/searchNotes'
import type { AiSourceNote } from './types'

const DEFAULT_TOP_K = 6
const MAX_CHARS_PER_NOTE = 1200
const MAX_TOTAL_CHARS = 6000

export interface RetrievedNote {
  tabId: string
  title: string
  snippet: string
  excerpt: string
}

/**
 * Ground "ask your notes" on existing FTS: keyword search → pack top hits for the model.
 * Token/keyword retrieval only (no embeddings yet) so offline-first search stays the source of truth.
 */
export function retrieveNotesForQuestion(
  tabs: Tab[],
  question: string,
  options?: { topK?: number; maxCharsPerNote?: number; maxTotalChars?: number },
): RetrievedNote[] {
  const topK = options?.topK ?? DEFAULT_TOP_K
  const maxPer = options?.maxCharsPerNote ?? MAX_CHARS_PER_NOTE
  const maxTotal = options?.maxTotalChars ?? MAX_TOTAL_CHARS

  const query = question.trim()
  if (!query || tabs.length === 0) return []

  // Prefer FTS hits; if the NL question yields nothing, fall back to recent notes so the model can still try.
  let hits = searchNotes(tabs, query, topK)
  if (hits.length === 0) {
    // Use significant tokens (≥3 chars) for a second pass.
    const tokens = query
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length >= 3)
    const seen = new Set<string>()
    for (const token of tokens) {
      for (const hit of searchNotes(tabs, token, topK)) {
        if (!seen.has(hit.tabId)) {
          seen.add(hit.tabId)
          hits.push(hit)
        }
        if (hits.length >= topK) break
      }
      if (hits.length >= topK) break
    }
  }

  if (hits.length === 0) {
    hits = [...tabs]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, Math.min(3, topK))
      .map((tab) => ({
        tabId: tab.id,
        title: tab.title || 'Untitled Note',
        snippet: (tab.content || '').slice(0, 80).replace(/\s+/g, ' ').trim(),
        match: 'body' as const,
        score: 0,
      }))
  }

  const results: RetrievedNote[] = []
  let total = 0

  for (const hit of hits.slice(0, topK)) {
    if (total >= maxTotal) break
    const tab = tabs.find((item) => item.id === hit.tabId)
    if (!tab) continue
    const title = tab.title || 'Untitled Note'
    const body = tab.content || ''
    const budget = Math.min(maxPer, maxTotal - total)
    const excerpt = body.length <= budget ? body : `${body.slice(0, budget)}…`
    total += excerpt.length
    results.push({
      tabId: tab.id,
      title,
      snippet: hit.snippet || excerpt.slice(0, 80),
      excerpt,
    })
  }

  return results
}

export function packRetrievedNotes(notes: RetrievedNote[]): string {
  if (notes.length === 0) return ''
  return notes
    .map((note, index) => {
      return [
        `### Source ${index + 1}: ${note.title}`,
        `id: ${note.tabId}`,
        note.excerpt,
      ].join('\n')
    })
    .join('\n\n')
}

export function toAiSources(notes: RetrievedNote[]): AiSourceNote[] {
  return notes.map((note) => ({
    tabId: note.tabId,
    title: note.title,
    snippet: note.snippet,
  }))
}
