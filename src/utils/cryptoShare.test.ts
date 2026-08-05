import { describe, expect, it } from 'vitest'
import { decryptText, encryptText, parseShare } from './cryptoShare'

describe('encrypted sharing', () => {
  it('round trips unicode text', async () => {
    const source = 'ApexPad 🔐\nSensitive note'
    const encrypted = await encryptText(source)
    await expect(decryptText(encrypted.payload, encrypted.key)).resolves.toBe(source)
  })

  it('rejects tampered payloads', async () => {
    const encrypted = await encryptText('secret')
    const tampered = `${encrypted.payload.slice(0, -2)}xx`
    await expect(decryptText(tampered, encrypted.key)).rejects.toThrow()
  })
  it('parses and rejects malformed share links', () => {
    expect(parseShare('payload#key')).toEqual({ payload: 'payload', key: 'key' })
    expect(() => parseShare('missing-key')).toThrow()
  })
})
