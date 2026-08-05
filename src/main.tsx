import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/inter/wght-italic.css'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import App from './App.tsx'
import { THEME_STORAGE_KEY } from './theme/themeStorage'

// Apply the persisted theme before the first paint to avoid a flash.
const stored = localStorage.getItem(THEME_STORAGE_KEY)
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
if (stored !== 'light' && stored !== 'dark') {
  // No saved preference: default to dark (brand default), fall back to system.
  const initial = prefersDark ? 'dark' : 'dark'
  document.documentElement.classList.add(initial)
} else {
  document.documentElement.classList.add(stored)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
