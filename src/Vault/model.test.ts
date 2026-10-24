import { describe, expect, it } from 'vitest'
import { backlinkNotes, extractWikilinks, tabsToVault } from './model'
import type { Note } from '../types/vault'

describe('vault model', () => {
  it('extracts wikilink titles and ignores aliases', () => {
    expect(extractWikilinks('See [[Alpha]] and [[Beta|alias]]')).toEqual(['Alpha', 'Beta'])
  })

  it('finds backlinks by note title', () => {
    const notes: Note[] = [
      { id: 'a', folderId: 'root', title: 'Alpha', content: '', createdAt: 1, updatedAt: 1 },
      { id: 'b', folderId: 'root', title: 'Beta', content: 'Link [[Alpha]]', createdAt: 1, updatedAt: 1 },
    ]
    expect(backlinkNotes(notes, 'a').map((note) => note.id)).toEqual(['b'])
  })

  it('migrates open tabs into a vault without dropping content', () => {
    const vault = tabsToVault([
      { id: 'tab-1', title: 'Legacy', content: 'old content', updatedAt: 5 },
    ], 'tab-1')
    expect(vault.version).toBe(1)
    expect(vault.notes[0]).toMatchObject({ id: 'tab-1', title: 'Legacy', content: 'old content' })
    expect(vault.openNoteIds).toEqual(['tab-1'])
    expect(vault.folders[0].id).toBe('root')
  })
})
