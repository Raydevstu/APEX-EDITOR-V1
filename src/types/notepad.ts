export type ThemeMode = 'light' | 'dark'

export interface Tab {
  id: string
  title: string
  content: string
  updatedAt: number
}

export interface Snapshot {
  id: string
  tabId: string
  timestamp: number
  content: string
  title: string
}

export interface PersistedTabsState {
  version: 1
  tabs: Tab[]
  activeTabId: string
}
