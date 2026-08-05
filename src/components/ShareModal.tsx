import { Copy, Lock } from 'lucide-react'
import { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { decryptText, encryptText, parseShare } from '../utils/cryptoShare'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'

export function ShareModal({ onClose }: { onClose: () => void }) {
  const content = useEditorStore((state) => state.tabs.find((tab) => tab.id === state.activeTabId)?.content ?? '')
  const [share, setShare] = useState('')
  const [importValue, setImportValue] = useState('')
  const [error, setError] = useState('')
  const createShare = async () => { try { const result = await encryptText(content); setShare(`${result.payload}#${result.key}`); setError('') } catch { setError('Web Crypto is unavailable in this browser.') } }
  const importShare = async () => { try { const parsed = parseShare(importValue.trim()); useEditorStore.getState().setContent(await decryptText(parsed.payload, parsed.key)); setError('Imported successfully'); setImportValue('') } catch { setError('That encrypted share is invalid or has been tampered with.') } }

  return (
    <Dialog open onClose={onClose} title="Encrypted sharing" titleId="share-title" icon={<Lock size={16} className="text-text-muted" aria-hidden="true" />} closeLabel="Close sharing">
      <p className="mb-3 text-xs text-text-muted">Generate a self-contained encrypted payload. The key stays in the generated link and is never stored.</p>
      <Button variant="primary" onClick={() => void createShare()}>Generate encrypted link</Button>
      {share && (
        <div className="mt-4 flex gap-2">
          <textarea aria-label="Generated encrypted share" readOnly value={share} className="h-24 min-w-0 flex-1 resize-none rounded-md border border-border bg-canvas p-2 text-xs text-text-secondary" />
          <IconButton label="Copy encrypted link" icon={Copy} className="self-start" onClick={() => void navigator.clipboard?.writeText(share)} />
        </div>
      )}
      <div className="mt-5 border-t border-hairline pt-4">
        <label htmlFor="encrypted-share-import" className="mb-2 block text-xs font-medium text-text-secondary">Import encrypted share</label>
        <textarea id="encrypted-share-import" value={importValue} onChange={(event) => setImportValue(event.target.value)} placeholder="Paste payload#key" className="h-20 w-full resize-none rounded-md border border-border bg-canvas p-2 text-xs text-text-secondary placeholder:text-text-faint" />
        <Button variant="secondary" className="mt-2" disabled={!importValue.trim()} onClick={() => void importShare()}>Decrypt and import</Button>
      </div>
      {error && <p role="status" className="mt-3 text-xs text-text-secondary">{error}</p>}
    </Dialog>
  )
}
