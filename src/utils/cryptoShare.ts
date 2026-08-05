const encoder = new TextEncoder()
const decoder = new TextDecoder()
const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

export async function encryptText(text: string): Promise<{ payload: string; key: string }> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text))
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  return { payload: `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`, key: bytesToBase64(rawKey) }
}

export async function decryptText(payload: string, rawKey: string): Promise<string> {
  const [ivPart, dataPart] = payload.split('.')
  if (!ivPart || !dataPart || !rawKey) throw new Error('Invalid encrypted share')
  const key = await crypto.subtle.importKey('raw', base64ToBytes(rawKey), { name: 'AES-GCM' }, false, ['decrypt'])
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(ivPart) }, key, base64ToBytes(dataPart))
  return decoder.decode(decrypted)
}

export function parseShare(value: string): { payload: string; key: string } {
  const separator = value.lastIndexOf('#')
  if (separator <= 0 || separator === value.length - 1) throw new Error('Invalid encrypted share link')
  return { payload: value.slice(0, separator), key: value.slice(separator + 1) }
}
