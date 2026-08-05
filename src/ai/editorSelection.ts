import type { EditorSelectionSnapshot } from './types'

let snapshot: EditorSelectionSnapshot | null = null

/** Keep last CodeMirror selection so palette/modals can still rewrite after focus leaves the editor. */
export function setEditorSelection(next: EditorSelectionSnapshot | null): void {
  snapshot = next
}

export function getEditorSelection(): EditorSelectionSnapshot | null {
  return snapshot
}

export function clearEditorSelection(): void {
  snapshot = null
}
