import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { PersistedTabsState, Snapshot, Tab, ThemeMode } from '../types/notepad'
import { ROOT_FOLDER_ID, VAULT_STORAGE_KEY, type Folder, type Note, type VaultPersisted } from '../types/vault'
import {
  createNoteRecord,
  ensureFolders,
  isVault,
  mergeOpenTabs,
  noteFromTab,
  noteToTab,
  openTabsFromVault,
  tabsToVault,
} from '../vault/model'

interface EditorStore {
  tabs: Tab[]
  activeTabId: string
  notes: Note[]
  folders: Folder[]
  theme: ThemeMode
  isZenMode: boolean
  snapshots: Snapshot[]
  isSaving: boolean
  isCommandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  addTab: () => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  setContent: (content: string) => void
  setTitle: (title: string) => void
  setTheme: (theme: ThemeMode) => void
  toggleZenMode: () => void
  takeSnapshot: () => Promise<void>
  restoreSnapshot: (id: string) => void
  loadPersistentState: () => Promise<void>
  createNote: (folderId?: string | null) => void
  openNote: (id: string) => void
  deleteNote: (id: string) => void
  moveNote: (id: string, folderId: string | null) => void
  createFolder: (name: string, parentId?: string | null) => void
  renameFolder: (id: string, name: string) => void
}

const TABS_KEY = 'apex_tabs_state'
const SNAPSHOTS_KEY = 'apex_snapshots'

let saveTimer: ReturnType<typeof setTimeout> | undefined

const notesOf = (notes: Note[] | undefined) => notes ?? []
const foldersOf = (folders: Folder[] | undefined) => ensureFolders(folders)

const isTab = (value: unknown): value is Tab => {
  if (!value || typeof value !== 'object') return false
  const tab = value as Partial<Tab>
  return typeof tab.id === 'string' && typeof tab.title === 'string' && typeof tab.content === 'string' && typeof tab.updatedAt === 'number'
}

const validTabs = (value: unknown): Tab[] => Array.isArray(value) ? value.filter(isTab) : []

const scheduleSave = (
  payload: { tabs: Tab[]; activeTabId: string; notes: Note[]; folders: Folder[] },
  setSaving: (saving: boolean) => void,
) => {
  if (saveTimer) clearTimeout(saveTimer)
  setSaving(true)
  saveTimer = setTimeout(async () => {
    const notes = mergeOpenTabs(payload.notes, payload.tabs)
    const vault: VaultPersisted = {
      version: 1,
      folders: ensureFolders(payload.folders),
      notes,
      openNoteIds: payload.tabs.map((tab) => tab.id),
      activeNoteId: payload.activeTabId,
    }
    await idbSet(TABS_KEY, { version: 1, tabs: payload.tabs, activeTabId: payload.activeTabId } satisfies PersistedTabsState)
    await idbSet(VAULT_STORAGE_KEY, vault)
    setSaving(false)
  }, 500)
}

export const useEditorStore = create<EditorStore>((set, get) => {
  const initialNote = createNoteRecord()
  const initialTab = noteToTab(initialNote)

  const persist = (next: { tabs: Tab[]; activeTabId: string; notes: Note[]; folders: Folder[] }) => {
    set(next)
    scheduleSave(next, (isSaving) => set({ isSaving }))
  }

  const patchActive = (patch: Partial<Pick<Tab, 'title' | 'content'>>) => {
    const activeTabId = get().activeTabId
    const updatedAt = Date.now()
    const tabs = get().tabs.map((tab) => tab.id === activeTabId ? { ...tab, ...patch, updatedAt } : tab)
    const active = tabs.find((tab) => tab.id === activeTabId)
    const notes = notesOf(get().notes)
    const nextNotes = active
      ? (notes.some((note) => note.id === active.id)
        ? notes.map((note) => note.id === active.id ? { ...note, title: active.title, content: active.content, updatedAt } : note)
        : [...notes, noteFromTab(active)])
      : notes
    persist({ tabs, activeTabId, notes: nextNotes, folders: foldersOf(get().folders) })
  }

  return {
    tabs: [initialTab],
    activeTabId: initialTab.id,
    notes: [initialNote],
    folders: ensureFolders([]),
    theme: 'dark',
    isZenMode: false,
    snapshots: [],
    isSaving: false,
    isCommandPaletteOpen: false,
    setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),

    addTab: () => get().createNote(ROOT_FOLDER_ID),

    createNote: (folderId = ROOT_FOLDER_ID) => {
      const note = createNoteRecord('Untitled Note', folderId)
      const tabs = [...get().tabs, noteToTab(note)]
      persist({
        tabs,
        activeTabId: note.id,
        notes: [...notesOf(get().notes), note],
        folders: foldersOf(get().folders),
      })
    },

    openNote: (id) => {
      const note = notesOf(get().notes).find((item) => item.id === id)
      if (!note) return
      const tabs = get().tabs.some((tab) => tab.id === id) ? get().tabs : [...get().tabs, noteToTab(note)]
      persist({ tabs, activeTabId: id, notes: notesOf(get().notes), folders: foldersOf(get().folders) })
    },

    closeTab: (id) => {
      const state = get()
      const index = state.tabs.findIndex((tab) => tab.id === id)
      if (index < 0) return

      let tabs = state.tabs.filter((tab) => tab.id !== id)
      let notes = notesOf(state.notes)
      if (tabs.length === 0) {
        const note = createNoteRecord()
        notes = [...notes, note]
        tabs = [noteToTab(note)]
      }

      const activeTabId = state.activeTabId === id
        ? tabs[Math.min(index, tabs.length - 1)].id
        : state.activeTabId
      persist({ tabs, activeTabId, notes, folders: foldersOf(state.folders) })
    },

    deleteNote: (id) => {
      let notes = notesOf(get().notes).filter((note) => note.id !== id)
      let tabs = get().tabs.filter((tab) => tab.id !== id)
      if (notes.length === 0) {
        const note = createNoteRecord()
        notes = [note]
        tabs = [noteToTab(note)]
      } else if (tabs.length === 0) {
        tabs = [noteToTab(notes[0])]
      }
      const activeTabId = tabs.some((tab) => tab.id === get().activeTabId) ? get().activeTabId : tabs[0].id
      persist({ tabs, activeTabId, notes, folders: foldersOf(get().folders) })
    },

    moveNote: (id, folderId) => {
      const notes = notesOf(get().notes).map((note) => note.id === id ? { ...note, folderId, updatedAt: Date.now() } : note)
      persist({ tabs: get().tabs, activeTabId: get().activeTabId, notes, folders: foldersOf(get().folders) })
    },

    createFolder: (name, parentId = ROOT_FOLDER_ID) => {
      const folder: Folder = { id: createNoteRecord().id, name: name.trim() || 'New folder', parentId }
      persist({
        tabs: get().tabs,
        activeTabId: get().activeTabId,
        notes: notesOf(get().notes),
        folders: [...foldersOf(get().folders), folder],
      })
    },

    renameFolder: (id, name) => {
      const trimmed = name.trim()
      if (!trimmed || id === ROOT_FOLDER_ID) return
      const folders = foldersOf(get().folders).map((folder) => folder.id === id ? { ...folder, name: trimmed } : folder)
      persist({ tabs: get().tabs, activeTabId: get().activeTabId, notes: notesOf(get().notes), folders })
    },

    setActiveTab: (activeTabId) => {
      if (!get().tabs.some((tab) => tab.id === activeTabId)) return
      persist({ tabs: get().tabs, activeTabId, notes: notesOf(get().notes), folders: foldersOf(get().folders) })
    },

    setContent: (content) => patchActive({ content }),
    setTitle: (title) => patchActive({ title }),

    setTheme: (theme) => set({ theme, isZenMode: theme === 'zen' }),
    toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode, theme: state.isZenMode ? 'dark' : 'zen' })),

    takeSnapshot: async () => {
      const { tabs, activeTabId, snapshots } = get()
      const activeTab = tabs.find((tab) => tab.id === activeTabId)
      if (!activeTab || !activeTab.content.trim()) return
      const snapshot: Snapshot = { id: createNoteRecord().id, tabId: activeTab.id, timestamp: Date.now(), content: activeTab.content, title: activeTab.title }
      const updated = [snapshot, ...snapshots].slice(0, 50)
      set({ snapshots: updated })
      await idbSet(SNAPSHOTS_KEY, updated)
    },

    restoreSnapshot: (id) => {
      const snapshot = get().snapshots.find((item) => item.id === id && item.tabId === get().activeTabId)
      if (!snapshot) return
      get().setTitle(snapshot.title)
      get().setContent(snapshot.content)
    },

    loadPersistentState: async () => {
      const [savedVault, savedState, savedSnapshots, legacyDoc] = await Promise.all([
        idbGet<unknown>(VAULT_STORAGE_KEY),
        idbGet<Partial<PersistedTabsState>>(TABS_KEY),
        idbGet<Snapshot[]>(SNAPSHOTS_KEY),
        idbGet<{ content?: string; title?: string }>('apex_active_doc'),
      ])
      const snapshots = Array.isArray(savedSnapshots) ? savedSnapshots : []

      if (isVault(savedVault) && savedVault.notes.length > 0) {
        const opened = openTabsFromVault(savedVault)
        set({
          notes: savedVault.notes,
          folders: ensureFolders(savedVault.folders),
          tabs: opened.tabs,
          activeTabId: opened.activeTabId,
          snapshots,
        })
        return
      }

      const tabs = validTabs(savedState?.tabs)
      if (tabs.length > 0) {
        const activeTabId = tabs.some((tab) => tab.id === savedState?.activeTabId) ? savedState!.activeTabId! : tabs[0].id
        const vault = tabsToVault(tabs, activeTabId)
        set({ notes: vault.notes, folders: vault.folders, tabs, activeTabId, snapshots })
        await idbSet(VAULT_STORAGE_KEY, vault)
        return
      }

      const migrated = legacyDoc && (legacyDoc.content || legacyDoc.title)
        ? [{ ...noteToTab(createNoteRecord(legacyDoc.title || 'Untitled Note')), content: legacyDoc.content || '', title: legacyDoc.title || 'Untitled Note' }]
        : [noteToTab(createNoteRecord())]
      const activeTabId = migrated[0].id
      const vault = tabsToVault(migrated, activeTabId)
      set({ notes: vault.notes, folders: vault.folders, tabs: migrated, activeTabId, snapshots })
      await idbSet(TABS_KEY, { version: 1, tabs: migrated, activeTabId } satisfies PersistedTabsState)
      await idbSet(VAULT_STORAGE_KEY, vault)
    },
  }
})
