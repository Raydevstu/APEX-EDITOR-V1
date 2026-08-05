import { describe, expect, it } from 'vitest'
import { applyTextTool } from './textTools'

describe('text tool edge cases', () => {
  it('keeps valid JSON stable when already formatted', () => {
    expect(applyTextTool('format-json', '{\n  "ok": true\n}')).toBe('{\n  "ok": true\n}')
  })

  it('returns invalid JSON unchanged', () => {
    expect(applyTextTool('format-json', '{broken')).toBe('{broken')
  })

  it('deduplicates repeated blank lines without losing content', () => {
    expect(applyTextTool('dedupe-lines', 'a\n\na\n\n')).toBe('a\n')
  })
})
