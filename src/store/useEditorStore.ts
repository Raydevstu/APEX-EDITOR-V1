import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { PersistedTabsState, Snapshot, Tab, ThemeMode } from '../types/notepad'
import { readTheme, writeTheme } from '../theme/themeStorage'

interface EditorStore {
  tabs: Tab[]
  activeTabId: string
  theme: ThemeMode
  isZenMode: boolean
  snapshots: Snapshot[]
  isSaving: boolean
  isHydrated: boolean
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
  flushSave: () => Promise<void>
}

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
const createTab = (title = 'Untitled Note'): Tab => ({ id: createId(), title, content: '', updatedAt: Date.now() })

const isTab = (value: unknown): value is Tab => {
  if (!value || typeof value !== 'object') return false
  const tab = value as Partial<Tab>
  return typeof tab.id === 'string' && typeof tab.title === 'string' && typeof tab.content === 'string' && typeof tab.updatedAt === 'number'
}

const validTabs = (value: unknown): Tab[] => Array.isArray(value) ? value.filter(isTab) : []

let saveTimer: ReturnType<typeof setTimeout> | undefined
let pendingSave: { tabs: Tab[]; activeTabId: string } | null = null
let sessionDirty = false

const CRASH_KEY = 'apex_tabs_crash'

const writeCrashMirror = (tabs: Tab[], activeTabId: string) => {
  try {
    localStorage.setItem(CRASH_KEY, JSON.stringify({ version: 1, tabs, activeTabId } satisfies PersistedTabsState))
  } catch {
    // Quota or private mode — IDB remains the primary store.
  }
}

const readCrashMirror = (): PersistedTabsState | null => {
  try {
    const raw = localStorage.getItem(CRASH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedTabsState>
    const tabs = validTabs(parsed.tabs)
    if (tabs.length === 0) return null
    const activeTabId = tabs.some((tab) => tab.id === parsed.activeTabId) ? parsed.activeTabId! : tabs[0].id
    return { version: 1, tabs, activeTabId }
  } catch {
    return null
  }
}

const persistTabs = async (tabs: Tab[], activeTabId: string) => {
  writeCrashMirror(tabs, activeTabId)
  await idbSet('apex_tabs_state', { version: 1, tabs, activeTabId } satisfies PersistedTabsState)
}

const scheduleSave = (tabs: Tab[], activeTabId: string, setSaving: (saving: boolean) => void) => {
  if (saveTimer) clearTimeout(saveTimer)
  pendingSave = { tabs, activeTabId }
  // Synchronous crash mirror so a hard reload within the debounce window keeps content.
  writeCrashMirror(tabs, activeTabId)
  setSaving(true)
  saveTimer = setTimeout(async () => {
    const payload = pendingSave
    pendingSave = null
    saveTimer = undefined
    if (!payload) {
      setSaving(false)
      return
    }
    await idbSet('apex_tabs_state', { version: 1, tabs: payload.tabs, activeTabId: payload.activeTabId } satisfies PersistedTabsState)
    setSaving(false)
  }, 500)
}

const markDirtyIfNeeded = (isHydrated: boolean) => {
  if (!isHydrated) sessionDirty = true
}

/** Test-only: clear module timers/dirty flags between cases. */
export const resetEditorSessionFlags = () => {
  sessionDirty = false
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = undefined
  pendingSave = null
  try { localStorage.removeItem(CRASH_KEY) } catch { /* ignore */ }
}

export const useEditorStore = create<EditorStore>((set, get) => {
  const initialTab = createTab()

  return {
    tabs: [initialTab],
    activeTabId: initialTab.id,
    theme: readTheme(),
    isZenMode: false,
    snapshots: [],
    isSaving: false,
    isHydrated: false,
    isCommandPaletteOpen: false,
    setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),

    addTab: () => {
      markDirtyIfNeeded(get().isHydrated)
      const tab = createTab()
      const tabs = [...get().tabs, tab]
      set({ tabs, activeTabId: tab.id })
      scheduleSave(tabs, tab.id, (isSaving) => set({ isSaving }))
    },

    closeTab: (id) => {
      markDirtyIfNeeded(get().isHydrated)
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
      markDirtyIfNeeded(get().isHydrated)
      const activeTabId = get().activeTabId
      const tabs = get().tabs.map((tab) => tab.id === activeTabId ? { ...tab, content, updatedAt: Date.now() } : tab)
      set({ tabs })
      scheduleSave(tabs, activeTabId, (isSaving) => set({ isSaving }))
    },

    setTitle: (title) => {
      markDirtyIfNeeded(get().isHydrated)
      const activeTabId = get().activeTabId
      const tabs = get().tabs.map((tab) => tab.id === activeTabId ? { ...tab, title, updatedAt: Date.now() } : tab)
      set({ tabs })
      scheduleSave(tabs, activeTabId, (isSaving) => set({ isSaving }))
    },

    setTheme: (theme) => {
      writeTheme(theme)
      set({ theme })
    },
    toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),

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

    flushSave: async () => {
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = undefined
      }
      const payload = pendingSave ?? { tabs: get().tabs, activeTabId: get().activeTabId }
      pendingSave = null
      set({ isSaving: true })
      await persistTabs(payload.tabs, payload.activeTabId)
      set({ isSaving: false })
    },

    loadPersistentState: async () => {
      const [savedState, savedSnapshots, legacyDoc] = await Promise.all([
        idbGet<Partial<PersistedTabsState>>('apex_tabs_state'),
        idbGet<Snapshot[]>('apex_snapshots'),
        idbGet<{ content?: string; title?: string }>('apex_active_doc'),
      ])

      const snapshots = Array.isArray(savedSnapshots) ? savedSnapshots : []

      if (sessionDirty) {
        sessionDirty = false
        set({ snapshots, isHydrated: true })
        const { tabs, activeTabId } = get()
        scheduleSave(tabs, activeTabId, (isSaving) => set({ isSaving }))
        return
      }

      // Prefer the synchronous crash mirror when it holds a newer or only copy.
      const crash = readCrashMirror()
      const idbTabs = validTabs(savedState?.tabs)
      const preferCrash = Boolean(crash && (
        idbTabs.length === 0
        || crash.tabs.some((tab) => {
          const peer = idbTabs.find((item) => item.id === tab.id)
          return !peer || tab.updatedAt > peer.updatedAt || tab.content !== peer.content
        })
        || crash.tabs.length > idbTabs.length
      ))

      if (preferCrash && crash) {
        set({ tabs: crash.tabs, activeTabId: crash.activeTabId, snapshots, isHydrated: true })
        await idbSet('apex_tabs_state', crash)
        return
      }

      if (idbTabs.length > 0) {
        const activeTabId = idbTabs.some((tab) => tab.id === savedState?.activeTabId) ? savedState!.activeTabId! : idbTabs[0].id
        set({ tabs: idbTabs, activeTabId, snapshots, isHydrated: true })
        return
      }

      const migrated = legacyDoc && (legacyDoc.content || legacyDoc.title)
        ? [{ ...createTab(legacyDoc.title || 'Untitled Note'), content: legacyDoc.content || '' }]
        : [createTab()]
      set({ tabs: migrated, activeTabId: migrated[0].id, snapshots, isHydrated: true })
      await persistTabs(migrated, migrated[0].id)
    },
  }
})
