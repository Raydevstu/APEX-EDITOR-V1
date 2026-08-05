import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { PersistedTabsState, Snapshot, Tab, ThemeMode } from '../types/notepad'

interface EditorStore {
  tabs: Tab[]
  activeTabId: string
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
}

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
const createTab = (title = 'Untitled Note'): Tab => ({ id: createId(), title, content: '', updatedAt: Date.now() })

let saveTimer: ReturnType<typeof setTimeout> | undefined

const scheduleSave = (tabs: Tab[], activeTabId: string, setSaving: (saving: boolean) => void) => {
  if (saveTimer) clearTimeout(saveTimer)
  setSaving(true)
  saveTimer = setTimeout(async () => {
    await idbSet('apex_tabs_state', { version: 1, tabs, activeTabId } satisfies PersistedTabsState)
    setSaving(false)
  }, 500)
}

const isTab = (value: unknown): value is Tab => {
  if (!value || typeof value !== 'object') return false
  const tab = value as Partial<Tab>
  return typeof tab.id === 'string' && typeof tab.title === 'string' && typeof tab.content === 'string' && typeof tab.updatedAt === 'number'
}

const validTabs = (value: unknown): Tab[] => Array.isArray(value) ? value.filter(isTab) : []

export const useEditorStore = create<EditorStore>((set, get) => {
  const initialTab = createTab()

  return {
    tabs: [initialTab],
    activeTabId: initialTab.id,
    theme: 'dark',
    isZenMode: false,
    snapshots: [],
    isSaving: false,
    isCommandPaletteOpen: false,
    setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),

    addTab: () => {
      const tab = createTab()
      const tabs = [...get().tabs, tab]
      set({ tabs, activeTabId: tab.id })
      scheduleSave(tabs, tab.id, (isSaving) => set({ isSaving }))
    },

    closeTab: (id) => {
      const state = get()
      const index = state.tabs.findIndex((tab) => tab.id === id)
      if (index < 0) return

      let tabs = state.tabs.filter((tab) => tab.id !== id)
      if (tabs.length === 0) tabs = [createTab()]

      const activeTabId = state.activeTabId === id
        ? tabs[Math.min(index, tabs.length - 1)].id
        : state.activeTabId

      set({ tabs, activeTabId })
      scheduleSave(tabs, activeTabId, (isSaving) => set({ isSaving }))
    },

    setActiveTab: (activeTabId) => {
      if (!get().tabs.some((tab) => tab.id === activeTabId)) return
      set({ activeTabId })
      scheduleSave(get().tabs, activeTabId, (isSaving) => set({ isSaving }))
    },

    setContent: (content) => {
      const activeTabId = get().activeTabId
      const tabs = get().tabs.map((tab) => tab.id === activeTabId ? { ...tab, content, updatedAt: Date.now() } : tab)
      set({ tabs })
      scheduleSave(tabs, activeTabId, (isSaving) => set({ isSaving }))
    },

    setTitle: (title) => {
      const activeTabId = get().activeTabId
      const tabs = get().tabs.map((tab) => tab.id === activeTabId ? { ...tab, title, updatedAt: Date.now() } : tab)
      set({ tabs })
      scheduleSave(tabs, activeTabId, (isSaving) => set({ isSaving }))
    },

    setTheme: (theme) => set({ theme, isZenMode: theme === 'zen' }),
    toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode, theme: state.isZenMode ? 'dark' : 'zen' })),

    takeSnapshot: async () => {
      const { tabs, activeTabId, snapshots } = get()
      const activeTab = tabs.find((tab) => tab.id === activeTabId)
      if (!activeTab || !activeTab.content.trim()) return
      const snapshot: Snapshot = { id: createId(), tabId: activeTab.id, timestamp: Date.now(), content: activeTab.content, title: activeTab.title }
      const updated = [snapshot, ...snapshots].slice(0, 50)
      set({ snapshots: updated })
      await idbSet('apex_snapshots', updated)
    },

    restoreSnapshot: (id) => {
      const snapshot = get().snapshots.find((item) => item.id === id && item.tabId === get().activeTabId)
      if (!snapshot) return
      get().setTitle(snapshot.title)
      get().setContent(snapshot.content)
    },

    loadPersistentState: async () => {
      const [savedState, savedSnapshots, legacyDoc] = await Promise.all([
        idbGet<Partial<PersistedTabsState>>('apex_tabs_state'),
        idbGet<Snapshot[]>('apex_snapshots'),
        idbGet<{ content?: string; title?: string }>('apex_active_doc'),
      ])

      const tabs = validTabs(savedState?.tabs)
      if (tabs.length > 0) {
        const activeTabId = tabs.some((tab) => tab.id === savedState?.activeTabId) ? savedState!.activeTabId! : tabs[0].id
        set({ tabs, activeTabId, snapshots: Array.isArray(savedSnapshots) ? savedSnapshots : [] })
        return
      }

      const migrated = legacyDoc && (legacyDoc.content || legacyDoc.title)
        ? [{ ...createTab(legacyDoc.title || 'Untitled Note'), content: legacyDoc.content || '' }]
        : [createTab()]
      set({ tabs: migrated, activeTabId: migrated[0].id, snapshots: Array.isArray(savedSnapshots) ? savedSnapshots : [] })
      await idbSet('apex_tabs_state', { version: 1, tabs: migrated, activeTabId: migrated[0].id } satisfies PersistedTabsState)
    },
  }
})
