import { describe, expect, it } from 'vitest'
import { applyTextTool } from './textTools'

describe('text tools', () => {
  it('formats JSON', () => expect(applyTextTool('format-json', '{"a":1}')).toBe('{\n  "a": 1\n}'))
  it('removes duplicate lines', () => expect(applyTextTool('dedupe-lines', 'a\nb\na')).toBe('a\nb'))
  it('trims blank lines', () => expect(applyTextTool('strip-whitespace', ' a \n\n b ')).toBe('a\nb'))
})
