import { Copy, Lock, X } from 'lucide-react'
import { useState } from 'react'
import { useModalFocus } from '../hooks/useModalFocus'
import { useEditorStore } from '../store/useEditorStore'
import { decryptText, encryptText, parseShare } from '../utils/cryptoShare'

export function ShareModal({ onClose }: { onClose: () => void }) {
  const content = useEditorStore((state) => state.tabs.find((tab) => tab.id === state.activeTabId)?.content ?? '')
  const [share, setShare] = useState('')
  const [importValue, setImportValue] = useState('')
  const [error, setError] = useState('')
  const dialogRef = useModalFocus(onClose)
  const createShare = async () => { try { const result = await encryptText(content); setShare(`${result.payload}#${result.key}`) } catch { setError('Web Crypto is unavailable in this browser.') } }
  const importShare = async () => { try { const parsed = parseShare(importValue.trim()); useEditorStore.getState().setContent(await decryptText(parsed.payload, parsed.key)); setError('Imported successfully'); setImportValue('') } catch { setError('That encrypted share is invalid or has been tampered with.') } }
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="share-title"><section ref={dialogRef} className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 id="share-title" className="flex items-center gap-2 text-base font-semibold"><Lock size={16} />Encrypted sharing</h2><button onClick={onClose} aria-label="Close sharing"><X size={18} /></button></div><p className="mb-3 text-xs text-slate-400">Generate a self-contained encrypted payload. The key stays in the generated link and is never stored.</p><button onClick={() => void createShare()} className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400">Generate encrypted link</button>{share && <div className="mt-4 flex gap-2"><textarea aria-label="Generated encrypted share" readOnly value={share} className="h-24 min-w-0 flex-1 resize-none rounded-md border border-slate-700 bg-slate-950 p-2 text-xs text-slate-300" /><button onClick={() => void navigator.clipboard?.writeText(share)} className="self-start rounded-md p-2 text-slate-400 hover:bg-slate-800" title="Copy link" aria-label="Copy encrypted link"><Copy size={16} /></button></div>}<div className="mt-5 border-t border-slate-800 pt-4"><label htmlFor="encrypted-share-import" className="mb-2 block text-xs text-slate-400">Import encrypted share</label><textarea id="encrypted-share-import" value={importValue} onChange={(event) => setImportValue(event.target.value)} placeholder="Paste payload#key" className="h-20 w-full resize-none rounded-md border border-slate-700 bg-slate-950 p-2 text-xs text-slate-300" /><button onClick={() => void importShare()} disabled={!importValue.trim()} className="mt-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-50">Decrypt and import</button></div>{error && <p role="status" className="mt-3 text-xs text-slate-300">{error}</p>}</section></div>
}
