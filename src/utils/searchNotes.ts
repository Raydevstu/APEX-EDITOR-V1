import type { SearchHit, Tab } from '../types/notepad'

const SNIPPET_RADIUS = 40
const MAX_RESULTS = 20

const buildSnippet = (content: string, index: number, queryLength: number): string => {
  if (!content) return ''
  const start = Math.max(0, index - SNIPPET_RADIUS)
  const end = Math.min(content.length, index + queryLength + SNIPPET_RADIUS)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < content.length ? '…' : ''
  return `${prefix}${content.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`
}

export function searchNotes(tabs: Tab[], query: string, limit = MAX_RESULTS): SearchHit[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  const hits: SearchHit[] = []

  for (const tab of tabs) {
    const title = tab.title ?? ''
    const content = tab.content ?? ''
    const titleIndex = title.toLowerCase().indexOf(normalized)
    const bodyIndex = content.toLowerCase().indexOf(normalized)
    const titleMatch = titleIndex >= 0
    const bodyMatch = bodyIndex >= 0
    if (!titleMatch && !bodyMatch) continue

    let score = 0
    if (titleMatch) score += 100
    if (bodyMatch) score += 10
    // Prefer more recent notes on ties.
    score += Math.min(9, Math.floor(tab.updatedAt / 1e12))

    const match: SearchHit['match'] = titleMatch && bodyMatch ? 'both' : titleMatch ? 'title' : 'body'
    const snippet = bodyMatch
      ? buildSnippet(content, bodyIndex, normalized.length)
      : title

    hits.push({
      tabId: tab.id,
      title: title || 'Untitled Note',
      snippet,
      match,
      score,
    })
  }

  return hits
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const aTab = tabs.find((tab) => tab.id === a.tabId)
      const bTab = tabs.find((tab) => tab.id === b.tabId)
      return (bTab?.updatedAt ?? 0) - (aTab?.updatedAt ?? 0)
    })
    .slice(0, limit)
}
