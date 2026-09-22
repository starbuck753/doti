import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarkdownField } from '../tasks/MarkdownField'
import { useNoteDetail } from './useNoteDetail'

export function NoteDetail() {
  const { t } = useTranslation()
  const { noteId } = useParams()
  const navigate = useNavigate()
  const { note, loading, update, deleteNote } = useNoteDetail(noteId)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [initialized, setInitialized] = useState(false)
  useEffect(() => { if (note && !initialized) { setTitle(note.title); setContent(note.content); setInitialized(true) } }, [note, initialized])
  useEffect(() => {
    if (!initialized || !note || content === note.content) return
    const timer = window.setTimeout(() => { void update({ content }) }, 600)
    return () => window.clearTimeout(timer)
  }, [content, initialized, note, update])
  if (loading) return <section className="note-detail-page"><p className="muted-text">{t('notes.loading')}</p></section>
  if (!note || note.deletedAt) return <section className="note-detail-page note-not-found"><button className="back-link" onClick={() => navigate('/notes')}>← {t('notes.backToNotes')}</button><h1>{t('notes.notFound')}</h1></section>
  const saveTitle = async () => { const next = title.trim(); if (next && next !== note.title) await update({ title: next }); else if (!next) setTitle(note.title) }
  const saveContent = async () => { if (content !== note.content) await update({ content }) }
  const remove = async () => { if (window.confirm(t('notes.confirmDelete'))) { await deleteNote(); navigate('/notes') } }
  return <section className="note-detail-page"><button className="back-link" onClick={() => navigate('/notes')}>← {t('notes.backToNotes')}</button>
    <input className="note-title-input" value={title} onChange={(event: { target: HTMLInputElement }) => setTitle(event.target.value)} onBlur={() => void saveTitle()} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') void saveTitle(); if (event.key === 'Escape') setTitle(note.title) }} />
    <MarkdownField value={content} onChange={setContent} onBlur={() => void saveContent()} emptyLabel={t('notes.startWriting')} />
    <button className="delete-task" onClick={() => void remove()}>{t('notes.delete')}</button>
  </section>
}
