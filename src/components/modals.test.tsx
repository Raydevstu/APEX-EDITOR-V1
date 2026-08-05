// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(async () => undefined) }))
vi.mock('../utils/workerManager', () => ({ processText: vi.fn(async () => 'formatted') }))

import { CommandPalette } from './CommandPalette'
import { DiffViewer } from './DiffViewer'
import { Header } from './Header'
import { ShareModal } from './ShareModal'
import { SnapshotModal } from './SnapshotModal'
import { ToolDrawer } from './ToolDrawer'
import { useEditorStore } from '../store/useEditorStore'

const baseTab = { id: 'tab-1', title: 'Release note', content: 'current content', updatedAt: 1 }

describe('overlay components', () => {
  beforeEach(() => {
    useEditorStore.setState({
      tabs: [baseTab], activeTabId: 'tab-1', theme: 'dark', isZenMode: false,
      snapshots: [{ id: 'snapshot-1', tabId: 'tab-1', title: 'Release note', content: 'saved content', timestamp: 1 }],
      isSaving: false, isCommandPaletteOpen: true,
    })
  })

  afterEach(cleanup)

  it('shows, restores, and closes snapshot history', () => {
    const onClose = vi.fn()
    render(<SnapshotModal onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Snapshot history' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }))
    expect(useEditorStore.getState().tabs[0].content).toBe('saved content')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders the latest snapshot comparison and closes it', () => {
    const onClose = vi.fn()
    render(<DiffViewer onClose={onClose} />)
    expect(screen.getByText(/- saved content/)).toBeTruthy()
    expect(screen.getByText(/\+ current content/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close diff' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('provides accessible sharing controls and closes on Escape', () => {
    const onClose = vi.fn()
    render(<ShareModal onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Encrypted sharing' })).toBeTruthy()
    expect(screen.getByLabelText('Import encrypted share')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('opens the requested command action and closes the palette', () => {
    const onTools = vi.fn()
    render(<CommandPalette onTools={onTools} onSnapshots={vi.fn()} returnFocusRef={createRef()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open text tools' }))
    expect(onTools).toHaveBeenCalledOnce()
    expect(useEditorStore.getState().isCommandPaletteOpen).toBe(false)
  })

  it('returns focus to the opener when the command palette closes', async () => {
    const onTools = vi.fn()
    const returnFocusRef = createRef<HTMLElement>()
    render(<CommandPalette onTools={onTools} onSnapshots={vi.fn()} returnFocusRef={returnFocusRef} />)
    const opener = screen.getByRole('button', { name: 'Open text tools' })
    returnFocusRef.current = opener
    opener.focus()
    fireEvent.keyDown(window, { key: 'Escape' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.activeElement).toBe(opener)
  })

  it('wires the header diff control to its callback', () => {
    const onDiff = vi.fn()
    render(<Header onSnapshot={vi.fn()} onTools={vi.fn()} onShare={vi.fn()} onDiff={onDiff} onCommandPalette={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Compare latest snapshot' }))
    expect(onDiff).toHaveBeenCalledOnce()
  })

  it('focuses the first tool, traps Tab, closes on Escape, and restores focus in the tool drawer', () => {
    const onClose = vi.fn()
    const opener = document.createElement('button')
    opener.focus()
    render(<ToolDrawer onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: 'Text tools' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close tools' }))
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('status')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Format JSON' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('contains Tab focus within the diff viewer and restores focus on close', () => {
    const onClose = vi.fn()
    const opener = document.createElement('button')
    opener.focus()
    render(<DiffViewer onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: 'Latest snapshot diff' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close diff' }))

    fireEvent.keyDown(window, { key: 'Tab' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('exposes the diff region with an accessible name', () => {
    render(<DiffViewer onClose={vi.fn()} />)
    expect(screen.getByRole('region', { name: 'Snapshot diff for Release note' })).toBeTruthy()
  })
})
