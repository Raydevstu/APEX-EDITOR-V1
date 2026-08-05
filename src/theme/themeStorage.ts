export const THEME_STORAGE_KEY = 'apexpad-theme'

export type PersistedTheme = 'light' | 'dark'

export function readTheme(): PersistedTheme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

export function writeTheme(theme: PersistedTheme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function applyThemeClass(theme: PersistedTheme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
