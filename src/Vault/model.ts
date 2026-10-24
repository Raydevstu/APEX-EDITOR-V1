import type { Tab } from '../types/notepad'
import {
  ROOT_FOLDER_ID,
  noteToTab,
  type Folder,
  type Note,
  type VaultPersisted,
} from '../types/vault'

const WIKILINK = /\[\[([^\]|#]+?)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g

export const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

export const rootFolder = (): Folder => ({ id: ROOT_FOLDER_ID, name: 'Notes', parentId: null })

export const isFolder = (value: unknown): value is Folder => {
  if (!value || typeof value !== 'object') return false
  const folder = value as Partial<Folder>
  return typeof folder.id === 'string'
    && typeof folder.name === 'string'
    && (folder.parentId === null || typeof folder.parentId === 'string')
}

export const isNote = (value: unknown): value is Note => {
  if (!value || typeof value !== 'object') return false
  const note = value as Partial<Note>
  return typeof note.id === 'string'
    && typeof note.title === 'string'
    && typeof note.content === 'string'
    && typeof note.createdAt === 'number'
    && typeof note.updatedAt === 'number'
    && (note.folderId === null || typeof note.folderId === 'string')
}

export const ensureFolders = (value: unknown): Folder[] => {
  const folders = Array.isArray(value) ? value.filter(isFolder) : []
  return folders.some((folder) => folder.id === ROOT_FOLDER_ID) ? folders : [rootFolder(), ...folders]
}

export const createNoteRecord = (title = 'Untitled Note', folderId: string | null = ROOT_FOLDER_ID): Note => {
  const now = Date.now()
  return { id: createId(), folderId, title, content: '', createdAt: now, updatedAt: now }
}

export const noteFromTab = (tab: Tab, folderId: string | null = ROOT_FOLDER_ID): Note => ({
  id: tab.id,
  folderId,
  title: tab.title,
  content: tab.content,
  createdAt: tab.updatedAt,
  updatedAt: tab.updatedAt,
})

export const tabsToVault = (tabs: Tab[], activeTabId: string): VaultPersisted => {
  const notes = tabs.map((tab) => noteFromTab(tab))
  const openNoteIds = notes.map((note) => note.id)
  return {
    version: 1,
    folders: [rootFolder()],
    notes,
    openNoteIds,
    activeNoteId: openNoteIds.includes(activeTabId) ? activeTabId : openNoteIds[0],
  }
}

export const isVault = (value: unknown): value is VaultPersisted => {
  if (!value || typeof value !== 'object') return false
  const vault = value as Partial<VaultPersisted>
  return vault.version === 1
    && Array.isArray(vault.folders)
    && Array.isArray(vault.notes)
    && vault.notes.every(isNote)
    && Array.isArray(vault.openNoteIds)
    && typeof vault.activeNoteId === 'string'
}

export const mergeOpenTabs = (notes: Note[], tabs: Tab[]): Note[] => {
  const byId = new Map(notes.map((note) => [note.id, note]))
  for (const tab of tabs) {
    const existing = byId.get(tab.id)
    byId.set(tab.id, existing
      ? { ...existing, title: tab.title, content: tab.content, updatedAt: tab.updatedAt }
      : noteFromTab(tab))
  }
  return [...byId.values()]
}

export const openTabsFromVault = (vault: VaultPersisted): { tabs: Tab[]; activeTabId: string } => {
  const notes = vault.notes.filter(isNote)
  const openIds = vault.openNoteIds.filter((id) => notes.some((note) => note.id === id))
  const visibleIds = openIds.length > 0 ? openIds : notes.map((note) => note.id)
  const tabs = visibleIds
    .map((id) => notes.find((note) => note.id === id))
    .filter((note): note is Note => Boolean(note))
    .map(noteToTab)
  const activeTabId = tabs.some((tab) => tab.id === vault.activeNoteId) ? vault.activeNoteId : tabs[0]?.id ?? ''
  return { tabs, activeTabId }
}

export function extractWikilinks(content: string): string[] {
  const titles = new Set<string>()
  for (const match of content.matchAll(WIKILINK)) {
    const title = match[1]?.trim()
    if (title) titles.add(title)
  }
  return [...titles]
}

export function backlinkNotes(notes: Note[], noteId: string): Note[] {
  const current = notes.find((note) => note.id === noteId)
  const title = current?.title.trim().toLowerCase()
  if (!title) return []
  return notes.filter((note) => note.id !== noteId && extractWikilinks(note.content).some((link) => link.toLowerCase() === title))
}
