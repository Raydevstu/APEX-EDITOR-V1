import { EyeOff, History, Moon, PanelRight, Share2, Sun, Terminal, GitCompare } from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'
import { IconButton } from '../ui/IconButton'
import { Logo } from '../ui/Logo'

export function Header({
  onSnapshot,
  onTools,
  onShare,
  onDiff,
  onCommandPalette,
}: {
  onSnapshot: () => void
  onTools: () => void
  onShare: () => void
  onDiff: () => void
  onCommandPalette: () => void
}) {
  const { tabs, activeTabId, setTitle, theme, setTheme, toggleZenMode, isZenMode, isSaving, takeSnapshot } = useEditorStore()
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const createSnapshot = async () => { await takeSnapshot(); onSnapshot() }

  if (isZenMode) return (
    <button
      className="fixed right-4 top-4 z-20 rounded-full border border-border bg-surface/90 p-2 text-text-muted shadow-md backdrop-blur transition-colors hover:text-text-primary"
      onClick={toggleZenMode}
      aria-label="Exit zen mode"
    >
      <EyeOff size={16} />
    </button>
  )

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-surface/90 px-4 text-text-primary backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-[13px] font-semibold tracking-tight text-text-primary">ApexPad</span>
        </span>
        <input
          className="w-56 min-w-0 border-b border-transparent bg-transparent px-1 py-0.5 text-sm font-medium outline-none transition-colors hover:border-border focus:border-accent"
          value={activeTab?.title ?? ''}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Note title"
        />
        <span
          key={isSaving ? 'saving' : 'saved'}
          className={`hidden items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs sm:inline-flex ${
            isSaving
              ? 'border-border bg-surface text-text-muted'
              : 'border-success/25 bg-success-soft/60 text-success'
          }`}
        >
          <span className={`size-1.5 rounded-full ${isSaving ? 'bg-text-muted' : 'bg-success'}`} aria-hidden="true" />
          {isSaving ? 'Saving…' : 'Saved locally'}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <IconButton label="Create snapshot" icon={History} onClick={() => void createSnapshot()} title="Create snapshot" />
        <IconButton label="Text tools" icon={PanelRight} onClick={onTools} />
        <IconButton label="Encrypted sharing" icon={Share2} onClick={onShare} />
        <IconButton label="Compare latest snapshot" icon={GitCompare} onClick={onDiff} />
        <div className="mx-1 h-5 w-px bg-hairline" aria-hidden="true" />
        <IconButton label="Command palette" icon={Terminal} onClick={onCommandPalette} />
        <IconButton label="Zen mode" icon={EyeOff} onClick={toggleZenMode} />
        <IconButton
          label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          icon={theme === 'dark' ? Sun : Moon}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      </div>
    </header>
  )
}
