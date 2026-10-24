import { FolderPlus, Link2, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { ROOT_FOLDER_ID } from '../types/vault'
import { backlinkNotes } from '../vault/model'

export function VaultSidebar({ className = '', onClose }: { className?: string; onClose?: () => void }) {
  const notes = useEditorStore((state) => state.notes ?? [])
  const folders = useEditorStore((state) => state.folders ?? [])
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const openNote = useEditorStore((state) => state.openNote)
  const createNote = useEditorStore((state) => state.createNote)
  const deleteNote = useEditorStore((state) => state.deleteNote)
  const createFolder = useEditorStore((state) => state.createFolder)
  const [query, setQuery] = useState('')
  const [folderName, setFolderName] = useState('')
  const [addingFolder, setAddingFolder] = useState(false)

  const needle = query.trim().toLowerCase()
  const visibleNotes = useMemo(
    () => notes.filter((note) => !needle || note.title.toLowerCase().includes(needle) || note.content.toLowerCase().includes(needle)),
    [needle, notes],
  )
  const childFolders = folders.filter((folder) => folder.parentId === ROOT_FOLDER_ID)
  const backlinks = backlinkNotes(notes, activeTabId)

  const notesIn = (folderId: string) => visibleNotes.filter((note) => note.folderId === folderId || (folderId === ROOT_FOLDER_ID && !note.folderId))

  return (
    <aside className={`h-full shrink-0 flex-col border-r border-slate-800 bg-slate-950 ${className}`} aria-label="Vault">
      <div className="flex items-center justify-between px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vault</p>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => createNote(ROOT_FOLDER_ID)} aria-label="Create vault note" title="New note">
            <Plus size={15} />
          </button>
          <button className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => setAddingFolder((open) => !open)} aria-label="Create folder" title="New folder">
            <FolderPlus size={15} />
          </button>
          {onClose && <button className="rounded px-1 text-xs text-slate-400 hover:text-white" onClick={onClose}>Close</button>}
        </div>
      </div>
      <div className="px-3 pb-2">
        <label className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-2">
          <Search size={13} className="text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" aria-label="Search vault" className="h-8 w-full bg-transparent text-xs outline-none" />
        </label>
      </div>
      {addingFolder && (
        <form className="flex gap-1 px-3 pb-2" onSubmit={(event) => { event.preventDefault(); createFolder(folderName); setFolderName(''); setAddingFolder(false) }}>
          <input value={folderName} onChange={(event) => setFolderName(event.target.value)} aria-label="Folder name" placeholder="Folder name" className="h-8 min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-900 px-2 text-xs outline-none" />
          <button className="rounded-md bg-slate-800 px-2 text-xs text-slate-200" type="submit">Add</button>
        </form>
      )}
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
        <NoteList notes={notesIn(ROOT_FOLDER_ID)} activeId={activeTabId} onOpen={(id) => { openNote(id); onClose?.() }} onDelete={deleteNote} />
        {childFolders.map((folder) => (
          <section key={folder.id} className="mt-3">
            <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">{folder.name}</p>
            <NoteList notes={notesIn(folder.id)} activeId={activeTabId} onOpen={(id) => { openNote(id); onClose?.() }} onDelete={deleteNote} />
            <button className="mt-1 px-2 text-[11px] text-indigo-300 hover:text-indigo-200" onClick={() => createNote(folder.id)}>New note in {folder.name}</button>
          </section>
        ))}
      </div>
      <section className="border-t border-slate-800 px-3 py-3">
        <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><Link2 size={12} />Backlinks</p>
        {backlinks.length === 0
          ? <p className="text-xs text-slate-500">No notes link here yet. Use [[Note title]] in another note.</p>
          : backlinks.map((note) => (
            <button key={note.id} className="block w-full truncate rounded px-1 py-1 text-left text-xs text-slate-300 hover:bg-slate-800" onClick={() => { openNote(note.id); onClose?.() }}>
              {note.title || 'Untitled Note'}
            </button>
          ))}
      </section>
    </aside>
  )
}

function NoteList({
  notes,
  activeId,
  onOpen,
  onDelete,
}: {
  notes: Array<{ id: string; title: string }>
  activeId: string
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (notes.length === 0) return <p className="px-2 py-1 text-xs text-slate-600">Empty</p>
  return (
    <ul className="space-y-0.5">
      {notes.map((note) => (
        <li key={note.id} className={`flex items-center rounded-md ${note.id === activeId ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-900'}`}>
          <button className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-xs" onClick={() => onOpen(note.id)}>
            {note.title || 'Untitled Note'}
          </button>
          <button className="mr-1 rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-white" onClick={() => onDelete(note.id)} aria-label={`Delete ${note.title || 'Untitled Note'}`}>
            <Trash2 size={12} />
          </button>
        </li>
      ))}
    </ul>
  )
}
