import { beforeEach, describe, expect, it, vi } from 'vitest'

const memory = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => memory.get(key)),
  set: vi.fn(async (key: string, value: unknown) => { memory.set(key, value) }),
}))

import { useEditorStore } from './useEditorStore'

describe('editor store', () => {
  beforeEach(() => {
    memory.clear()
    useEditorStore.setState({
      tabs: [{ id: 'tab-1', title: 'Note', content: '', updatedAt: 1 }],
      activeTabId: 'tab-1', theme: 'dark', isZenMode: false, snapshots: [],
      isSaving: false, isCommandPaletteOpen: false,
    })
  })

  it('adds, switches, and closes tabs safely', () => {
    useEditorStore.getState().addTab()
    const added = useEditorStore.getState().activeTabId
    expect(useEditorStore.getState().tabs).toHaveLength(2)
    useEditorStore.getState().closeTab(added)
    expect(useEditorStore.getState().tabs).toHaveLength(1)
    expect(useEditorStore.getState().activeTabId).toBe('tab-1')
  })

  it('does not create a snapshot for empty content', async () => {
    await useEditorStore.getState().takeSnapshot()
    expect(useEditorStore.getState().snapshots).toHaveLength(0)
  })

  it('creates and restores a snapshot', async () => {
    useEditorStore.getState().setTitle('Draft')
    useEditorStore.getState().setContent('before')
    await useEditorStore.getState().takeSnapshot()
    useEditorStore.getState().setContent('after')
    const snapshotId = useEditorStore.getState().snapshots[0].id
    useEditorStore.getState().restoreSnapshot(snapshotId)
    expect(useEditorStore.getState().tabs[0]).toMatchObject({ title: 'Draft', content: 'before' })
  })

  it('keeps the newest 50 snapshots in newest-first order', async () => {
    for (let index = 0; index < 55; index += 1) {
      useEditorStore.getState().setContent(`revision-${index}`)
      await useEditorStore.getState().takeSnapshot()
    }
    const snapshots = useEditorStore.getState().snapshots
    expect(snapshots).toHaveLength(50)
    expect(snapshots[0].content).toBe('revision-54')
    expect(snapshots.at(-1)?.content).toBe('revision-5')
  })

  it('ignores corrupted persisted records and uses a safe default', async () => {
    memory.set('apex_tabs_state', { tabs: [{ broken: true }] })
    memory.set('apex_snapshots', { broken: true })
    await useEditorStore.getState().loadPersistentState()
    expect(useEditorStore.getState().tabs).toHaveLength(1)
    expect(useEditorStore.getState().tabs[0].content).toBe('')
    expect(useEditorStore.getState().snapshots).toEqual([])
  })

  it('migrates the legacy active document once', async () => {
    memory.set('apex_active_doc', { title: 'Legacy', content: 'old content' })
    await useEditorStore.getState().loadPersistentState()
    expect(useEditorStore.getState().tabs[0]).toMatchObject({ title: 'Legacy', content: 'old content' })
    expect(memory.get('apex_tabs_state')).toMatchObject({ version: 1 })
  })
})
