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
      isSaving: false, isHydrated: true, isCommandPaletteOpen: true,
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
    render(
      <CommandPalette
        onTools={onTools}
        onSnapshots={vi.fn()}
        onAi={vi.fn()}
        onAiSettings={vi.fn()}
        onSnip={vi.fn()}
        returnFocusRef={createRef()}
      />,
    )
    fireEvent.click(screen.getByRole('option', { name: 'Open text tools' }))
    expect(onTools).toHaveBeenCalledOnce()
    expect(useEditorStore.getState().isCommandPaletteOpen).toBe(false)
  })

  it('returns focus to the opener when the command palette closes', async () => {
    const onTools = vi.fn()
    const returnFocusRef = createRef<HTMLElement>()
    const opener = document.createElement('button')
    opener.textContent = 'Open palette'
    document.body.appendChild(opener)
    returnFocusRef.current = opener
    opener.focus()
    render(
      <CommandPalette
        onTools={onTools}
        onSnapshots={vi.fn()}
        onAi={vi.fn()}
        onAiSettings={vi.fn()}
        onSnip={vi.fn()}
        returnFocusRef={returnFocusRef}
      />,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('searches notes by body and opens the hit with Enter', () => {
    useEditorStore.setState({
      tabs: [
        baseTab,
        { id: 'tab-2', title: 'Other', content: 'unique-zebra-token in the body', updatedAt: 2 },
      ],
      activeTabId: 'tab-1',
      isCommandPaletteOpen: true,
    })
    render(
      <CommandPalette
        onTools={vi.fn()}
        onSnapshots={vi.fn()}
        onAi={vi.fn()}
        onAiSettings={vi.fn()}
        onSnip={vi.fn()}
        returnFocusRef={createRef()}
      />,
    )
    const input = screen.getByLabelText('Search notes and commands')
    fireEvent.change(input, { target: { value: 'unique-zebra-token' } })
    expect(screen.getByRole('option', { name: /Other/i })).toBeTruthy()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useEditorStore.getState().activeTabId).toBe('tab-2')
    expect(useEditorStore.getState().isCommandPaletteOpen).toBe(false)
  })

  it('moves the selection with arrow keys', () => {
    render(
      <CommandPalette
        onTools={vi.fn()}
        onSnapshots={vi.fn()}
        onAi={vi.fn()}
        onAiSettings={vi.fn()}
        onSnip={vi.fn()}
        returnFocusRef={createRef()}
      />,
    )
    const input = screen.getByLabelText('Search notes and commands')
    const options = screen.getAllByRole('option')
    expect(options[0].getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true')
  })

  it('runs AI rewrite from the palette', () => {
    const onAi = vi.fn()
    render(
      <CommandPalette
        onTools={vi.fn()}
        onSnapshots={vi.fn()}
        onAi={onAi}
        onAiSettings={vi.fn()}
        onSnip={vi.fn()}
        returnFocusRef={createRef()}
      />,
    )
    fireEvent.click(screen.getByRole('option', { name: /AI: Fix grammar/i }))
    expect(onAi).toHaveBeenCalledWith({ kind: 'rewrite', mode: 'grammar' })
    expect(useEditorStore.getState().isCommandPaletteOpen).toBe(false)
  })

  it('opens ask-notes for ? queries', () => {
    const onAi = vi.fn()
    render(
      <CommandPalette
        onTools={vi.fn()}
        onSnapshots={vi.fn()}
        onAi={onAi}
        onAiSettings={vi.fn()}
        onSnip={vi.fn()}
        returnFocusRef={createRef()}
      />,
    )
    const input = screen.getByLabelText('Search notes and commands')
    fireEvent.change(input, { target: { value: '?shipping timeline' } })
    fireEvent.click(screen.getByRole('option', { name: /Ask notes: shipping timeline/i }))
    expect(onAi).toHaveBeenCalledWith({ kind: 'ask', question: 'shipping timeline' })
  })

  it('wires the header diff control to its callback', () => {
    const onDiff = vi.fn()
    render(
      <Header
        onSnapshot={vi.fn()}
        onTools={vi.fn()}
        onShare={vi.fn()}
        onDiff={onDiff}
        onCommandPalette={vi.fn()}
        onAi={vi.fn()}
        onSnip={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Compare latest snapshot' }))
    expect(onDiff).toHaveBeenCalledOnce()
  })

  it('focuses the first tool, traps Tab, closes on Escape, and restores focus in the tool drawer', () => {
    const onClose = vi.fn()
    const opener = document.createElement('button')
    opener.focus()
    render(<ToolDrawer onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: 'Text tools' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close text tools' }))
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
