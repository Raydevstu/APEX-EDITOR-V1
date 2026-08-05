import { describe, expect, it } from 'vitest'
import type { Tab } from '../types/notepad'
import { packRetrievedNotes, retrieveNotesForQuestion } from './retrieval'

const tab = (partial: Partial<Tab> & Pick<Tab, 'id' | 'title' | 'content'>): Tab => ({
  updatedAt: partial.updatedAt ?? 1,
  ...partial,
})

describe('retrieveNotesForQuestion', () => {
  const tabs = [
    tab({ id: 'a', title: 'Q3 roadmap', content: 'Ship search and AI rewrite by September', updatedAt: 30 }),
    tab({ id: 'b', title: 'Groceries', content: 'milk eggs bread', updatedAt: 10 }),
    tab({ id: 'c', title: 'Meeting notes', content: 'Discussed the roadmap timeline with design', updatedAt: 20 }),
  ]

  it('returns empty for blank questions', () => {
    expect(retrieveNotesForQuestion(tabs, '  ')).toEqual([])
  })

  it('ranks FTS title hits and packs excerpts', () => {
    const hits = retrieveNotesForQuestion(tabs, 'roadmap')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].tabId).toBe('a')
    expect(hits[0].excerpt.toLowerCase()).toContain('search')
    const packed = packRetrievedNotes(hits)
    expect(packed).toContain('Q3 roadmap')
    expect(packed).toContain('id: a')
  })

  it('tokenizes natural-language questions when full phrase misses', () => {
    const hits = retrieveNotesForQuestion(tabs, 'what did I write about milk?')
    expect(hits.some((hit) => hit.tabId === 'b')).toBe(true)
  })

  it('falls back to recent notes when nothing matches', () => {
    const hits = retrieveNotesForQuestion(tabs, 'zzzznonexistent')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].tabId).toBe('a') // most recent
  })
})
