import { describe, expect, it } from 'vitest'
import type { Tab } from '../types/notepad'
import { searchNotes } from './searchNotes'

const tab = (partial: Partial<Tab> & Pick<Tab, 'id' | 'title' | 'content'>): Tab => ({
  updatedAt: partial.updatedAt ?? 1,
  ...partial,
})

describe('searchNotes', () => {
  const tabs = [
    tab({ id: '1', title: 'Grocery list', content: 'milk eggs bread', updatedAt: 10 }),
    tab({ id: '2', title: 'Work', content: 'ship the grocery feature', updatedAt: 20 }),
    tab({ id: '3', title: 'Alpha plan', content: 'totally unrelated', updatedAt: 30 }),
  ]

  it('returns empty for blank queries', () => {
    expect(searchNotes(tabs, '')).toEqual([])
    expect(searchNotes(tabs, '   ')).toEqual([])
  })

  it('matches title and ranks title hits above body-only hits', () => {
    const hits = searchNotes(tabs, 'grocery')
    expect(hits.map((hit) => hit.tabId)).toEqual(['1', '2'])
    expect(hits[0].match).toBe('title')
    expect(hits[1].match).toBe('body')
  })

  it('matches body text and builds a snippet', () => {
    const hits = searchNotes(tabs, 'unrelated')
    expect(hits).toHaveLength(1)
    expect(hits[0].tabId).toBe('3')
    expect(hits[0].match).toBe('body')
    expect(hits[0].snippet.toLowerCase()).toContain('unrelated')
  })

  it('is case-insensitive', () => {
    expect(searchNotes(tabs, 'WORK')[0]?.tabId).toBe('2')
  })

  it('prefers more recently updated notes when scores tie', () => {
    const tied = [
      tab({ id: 'old', title: 'Shared', content: '', updatedAt: 1 }),
      tab({ id: 'new', title: 'Shared', content: '', updatedAt: 99 }),
    ]
    expect(searchNotes(tied, 'shared').map((hit) => hit.tabId)).toEqual(['new', 'old'])
  })

  it('caps results at the limit', () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      tab({ id: `t-${index}`, title: `Note ${index}`, content: 'needle here', updatedAt: index }),
    )
    expect(searchNotes(many, 'needle', 5)).toHaveLength(5)
  })
})
