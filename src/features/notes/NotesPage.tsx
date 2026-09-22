import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Note } from '../../domain/models'
import { useNotes } from './useNotes'

function formatUpdated(note: Note, locale: string, t: (key: string) => string) {
  const date = new Date(note.updatedAt)
  const today = new Date()
  if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) return t('notes.updatedToday')
  return `${t('notes.updated')} ${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date)}`
}

function NoteRow({ note, locale, onClick }: { key?: string; note: Note; locale: string; onClick: () => void }) {
  const { t } = useTranslation()
  return <button className="note-row" onClick={onClick}><span className="note-mark">▤</span><span className="note-row-content"><strong>{note.title}</strong><small>{formatUpdated(note, locale, t)}</small></span></button>
}

export function NotesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { notes, createNote } = useNotes()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const filtered = notes.filter((note) => `${note.title} ${note.content}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const submit = async () => { if (!title.trim()) return; const note = await createNote(title.trim()); setTitle(''); setCreating(false); navigate(`/notes/${note.id}`) }
  return <section className="notes-page"><div className="notes-heading"><div><p className="eyebrow">Doti</p><h1>{t('navigation.notes')}</h1></div><button className="add-button" aria-label={t('notes.addTitle')} onClick={() => setCreating(true)}>+</button></div>
    {creating && <input autoFocus className="note-create-input" value={title} onChange={(event: { target: HTMLInputElement }) => setTitle(event.target.value)} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') void submit(); if (event.key === 'Escape') { setTitle(''); setCreating(false) } }} placeholder={t('notes.untitled')} />}
    <input className="notes-search" value={query} onChange={(event: { target: HTMLInputElement }) => setQuery(event.target.value)} placeholder={t('notes.search')} aria-label={t('notes.search')} />
    <div className="notes-list">{filtered.map((note) => <NoteRow key={note.id} note={note} locale={i18n.language} onClick={() => navigate(`/notes/${note.id}`)} />)}</div>
    {!notes.length && !creating && <p className="notes-empty">{t('notes.empty')}</p>}
    {notes.length > 0 && !filtered.length && <p className="notes-empty">{t('notes.noResults')}</p>}
  </section>
}
