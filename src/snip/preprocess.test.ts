import { describe, expect, it } from 'vitest'
import { insertAtOffset } from './preprocess'

describe('insertAtOffset', () => {
  it('inserts into empty content', () => {
    expect(insertAtOffset('', 0, 'Hello')).toBe('Hello\n')
  })

  it('inserts at end with separation', () => {
    expect(insertAtOffset('Note body', 9, 'OCR line')).toBe('Note body\n\nOCR line\n')
  })

  it('inserts at start', () => {
    expect(insertAtOffset('rest', 0, 'Head')).toBe('Head\n\nrest')
  })

  it('clamps offset', () => {
    expect(insertAtOffset('ab', 99, 'x')).toContain('x')
  })
})
