import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

/**
 * ApexPad CodeMirror themes — token-matched to the design system.
 * Dark is tuned to sit on the --canvas surface; light is a clean
 * high-readability theme. Both reference the same CSS custom properties
 * so they track the active theme automatically.
 */

const sharedDark = {
  '&': { backgroundColor: 'var(--cm-bg)', color: 'var(--text-primary)' },
  '.cm-content': { caretColor: 'var(--accent)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--selection)',
  },
  '.cm-activeLine': { backgroundColor: 'oklch(0.16 0.012 262 / 0.6)' },
  '.cm-activeLineGutter': { backgroundColor: 'oklch(0.16 0.012 262 / 0.6)' },
  '.cm-gutters': {
    backgroundColor: 'var(--cm-gutter)',
    color: 'var(--text-faint)',
    borderRight: '1px solid var(--hairline)',
  },
  '.cm-lineNumbers .cm-gutterElement': { color: 'var(--text-faint)' },
  '.cm-gutterElement.cm-activeLineGutter': { color: 'var(--text-muted)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'oklch(0.3 0.07 262 / 0.5)',
    outline: '1px solid var(--border-strong)',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'oklch(0.32 0.08 262 / 0.6)',
    outline: '1px solid var(--accent-soft-border)',
  },
  '.cm-selectionMatch': { backgroundColor: 'oklch(0.32 0.06 262 / 0.4)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-md)',
    color: 'var(--text-primary)',
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--surface-tinted)',
    color: 'var(--text-primary)',
  },
  '.cm-searchMatch': { backgroundColor: 'oklch(0.4 0.1 262 / 0.4)' },
  '.cm-searchMatch-selected': { backgroundColor: 'oklch(0.5 0.13 262 / 0.5)' },
  '.cm-panels': { backgroundColor: 'var(--cm-bg)', color: 'var(--text-secondary)', borderTop: '1px solid var(--hairline)' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)' },
}

const sharedLight = {
  '&': { backgroundColor: 'var(--cm-bg)', color: 'var(--text-primary)' },
  '.cm-content': { caretColor: 'var(--accent)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--selection)',
  },
  '.cm-activeLine': { backgroundColor: 'oklch(0.955 0.01 262 / 0.6)' },
  '.cm-activeLineGutter': { backgroundColor: 'oklch(0.955 0.01 262 / 0.6)' },
  '.cm-gutters': {
    backgroundColor: 'var(--cm-gutter)',
    color: 'var(--text-faint)',
    borderRight: '1px solid var(--hairline)',
  },
  '.cm-lineNumbers .cm-gutterElement': { color: 'var(--text-faint)' },
  '.cm-gutterElement.cm-activeLineGutter': { color: 'var(--text-muted)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'oklch(0.9 0.04 262 / 0.6)',
    outline: '1px solid var(--accent-soft-border)',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'oklch(0.88 0.05 262 / 0.7)',
    outline: '1px solid var(--accent-contrast)',
  },
  '.cm-selectionMatch': { backgroundColor: 'oklch(0.88 0.05 262 / 0.5)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-md)',
    color: 'var(--text-primary)',
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--surface-tinted)',
    color: 'var(--text-primary)',
  },
  '.cm-searchMatch': { backgroundColor: 'oklch(0.8 0.08 262 / 0.4)' },
  '.cm-searchMatch-selected': { backgroundColor: 'oklch(0.72 0.11 262 / 0.5)' },
  '.cm-panels': { backgroundColor: 'var(--cm-bg)', color: 'var(--text-secondary)', borderTop: '1px solid var(--hairline)' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)' },
}

/** Syntax highlighting: dark palette (mirrors oneDark intent on our canvas). */
const syntaxDark = {
  '& .cm-keyword': { color: 'oklch(0.72 0.14 296)' },
  '& .cm-atom': { color: 'oklch(0.78 0.16 262)' },
  '& .cm-number': { color: 'oklch(0.8 0.14 240)' },
  '& .cm-def': { color: 'oklch(0.82 0.09 140)' },
  '& .cm-variable': { color: 'var(--text-primary)' },
  '& .cm-variable-2': { color: 'oklch(0.8 0.08 225)' },
  '& .cm-variable-3': { color: 'oklch(0.8 0.1 290)' },
  '& .cm-property': { color: 'oklch(0.75 0.1 230)' },
  '& .cm-operator': { color: 'oklch(0.72 0.1 280)' },
  '& .cm-comment': { color: 'oklch(0.5 0.02 262)' },
  '& .cm-string': { color: 'oklch(0.78 0.12 155)' },
  '& .cm-string-2': { color: 'oklch(0.75 0.1 155)' },
  '& .cm-meta': { color: 'oklch(0.62 0.08 262)' },
  '& .cm-qualifier': { color: 'oklch(0.78 0.13 300)' },
  '& .cm-builtin': { color: 'oklch(0.78 0.12 330)' },
  '& .cm-bracket': { color: 'var(--text-muted)' },
  '& .cm-tag': { color: 'oklch(0.74 0.13 320)' },
  '& .cm-attribute': { color: 'oklch(0.76 0.13 220)' },
  '& .cm-hr': { color: 'var(--text-faint)' },
  '& .cm-link': { color: 'oklch(0.75 0.1 230)', textDecoration: 'underline' },
  '& .cm-error': { color: 'oklch(0.68 0.16 25)', backgroundColor: 'oklch(0.35 0.06 25 / 0.5)' },
  '& .cm-header': { color: 'oklch(0.76 0.12 262)', fontWeight: 600 },
  '& .cm-quote': { color: 'var(--text-muted)', fontStyle: 'italic' },
  '& .cm-strong': { fontWeight: 700 },
  '& .cm-em': { fontStyle: 'italic' },
  '& .cm-strikethrough': { textDecoration: 'line-through' },
}

/** Syntax highlighting: light palette (high readability on near-white). */
const syntaxLight = {
  '& .cm-keyword': { color: 'oklch(0.45 0.14 296)' },
  '& .cm-atom': { color: 'oklch(0.48 0.17 262)' },
  '& .cm-number': { color: 'oklch(0.42 0.14 240)' },
  '& .cm-def': { color: 'oklch(0.5 0.12 140)' },
  '& .cm-variable': { color: 'var(--text-primary)' },
  '& .cm-variable-2': { color: 'oklch(0.42 0.1 225)' },
  '& .cm-variable-3': { color: 'oklch(0.45 0.12 290)' },
  '& .cm-property': { color: 'oklch(0.4 0.12 230)' },
  '& .cm-operator': { color: 'oklch(0.45 0.1 280)' },
  '& .cm-comment': { color: 'oklch(0.58 0.02 262)' },
  '& .cm-string': { color: 'oklch(0.45 0.1 155)' },
  '& .cm-string-2': { color: 'oklch(0.5 0.09 155)' },
  '& .cm-meta': { color: 'oklch(0.55 0.06 262)' },
  '& .cm-qualifier': { color: 'oklch(0.42 0.13 300)' },
  '& .cm-builtin': { color: 'oklch(0.44 0.13 330)' },
  '& .cm-bracket': { color: 'var(--text-muted)' },
  '& .cm-tag': { color: 'oklch(0.42 0.13 320)' },
  '& .cm-attribute': { color: 'oklch(0.44 0.14 220)' },
  '& .cm-hr': { color: 'var(--text-faint)' },
  '& .cm-link': { color: 'oklch(0.4 0.12 230)', textDecoration: 'underline' },
  '& .cm-error': { color: 'oklch(0.55 0.16 25)', backgroundColor: 'oklch(0.94 0.04 25 / 0.5)' },
  '& .cm-header': { color: 'oklch(0.4 0.12 262)', fontWeight: 600 },
  '& .cm-quote': { color: 'var(--text-muted)', fontStyle: 'italic' },
  '& .cm-strong': { fontWeight: 700 },
  '& .cm-em': { fontStyle: 'italic' },
  '& .cm-strikethrough': { textDecoration: 'line-through' },
}

export const apexDarkTheme = EditorView.theme(
  { ...sharedDark, ...syntaxDark, '.cm-scroller': { fontFamily: 'JetBrains Mono Variable, JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' } },
  { dark: true },
)

export const apexLightTheme = EditorView.theme(
  { ...sharedLight, ...syntaxLight, '.cm-scroller': { fontFamily: 'JetBrains Mono Variable, JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' } },
  { dark: false },
)

export function apexThemeFor(isDark: boolean): Extension {
  return isDark ? apexDarkTheme : apexLightTheme
}
