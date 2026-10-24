import type { Tab } from './notepad'

export const ROOT_FOLDER_ID = 'root'
export const VAULT_STORAGE_KEY = 'apex_vault_state'

export interface Folder {
  id: string
  name: string
  parentId: string | null
}

export interface Note {
  id: string
  folderId: string | null
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface VaultPersisted {
  version: 1
  folders: Folder[]
  notes: Note[]
  openNoteIds: string[]
  activeNoteId: string
}

export const noteToTab = (note: Note): Tab => ({
  id: note.id,
  title: note.title,
  content: note.content,
  updatedAt: note.updatedAt,
})
