import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarkdownField } from '../tasks/MarkdownField'
import { useNoteDetail } from './useNoteDetail'
import { useTaskNoteLinks } from '../links/useTaskNoteLinks'
import { LinkPicker, QuickTaskCreator } from '../links/LinkPicker'
import { useAllTasks } from '../tasks/useTasks'

export function NoteDetail() {
  const { t } = useTranslation()
  const { noteId } = useParams()
  const navigate = useNavigate()
  const { note, loading, update, deleteNote } = useNoteDetail(noteId)
  const { tasks: linkedTasks, linkTask, unlinkTask, createTask } = useTaskNoteLinks({ noteId })
  const { tasks: allTasks } = useAllTasks()
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
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
  const availableTasks = allTasks.filter((task) => !linkedTasks.some((linked) => linked.id === task.id))
  return <section className="note-detail-page"><button className="back-link" onClick={() => navigate('/notes')}>← {t('notes.backToNotes')}</button>
    <input className="note-title-input" value={title} onChange={(event: { target: HTMLInputElement }) => setTitle(event.target.value)} onBlur={() => void saveTitle()} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') void saveTitle(); if (event.key === 'Escape') setTitle(note.title) }} />
    <MarkdownField value={content} onChange={setContent} onBlur={() => void saveContent()} emptyLabel={t('notes.startWriting')} />
    <section className="linked-section"><div className="linked-heading"><h2>{t('links.linkedTasks')}</h2><button className="linked-add" aria-label={t('links.linkTask')} onClick={() => setShowTaskPicker(!showTaskPicker)}>+</button></div>{showTaskPicker && <LinkPicker title={t('links.linkTask')} searchPlaceholder={t('links.searchTasks')} items={availableTasks.map((task) => ({ id: task.id, title: task.title }))} emptyLabel={t('links.noTasksAvailable')} createLabel={t('links.createTask')} onSelect={(id) => { void linkTask(id); setShowTaskPicker(false) }} onCreate={() => { setShowTaskPicker(false); setCreatingTask(true) }} onClose={() => setShowTaskPicker(false)} />}{creatingTask && <QuickTaskCreator onCreate={async (taskTitle, bucket) => { const created = await createTask(taskTitle, bucket); if (created) { setCreatingTask(false) } }} onCancel={() => setCreatingTask(false)} />}{linkedTasks.length ? <div className="linked-list">{linkedTasks.map((task) => <div className="linked-row" key={task.id}><button onClick={() => navigate(`/tasks/${task.id}`)}><span className="linked-check">{task.status === 'completed' ? '✓' : '○'}</span>{task.title}<span className="linked-chevron">›</span></button><button className="unlink-button" aria-label={`${t('links.unlink')} ${task.title}`} onClick={() => void unlinkTask(task.id)}>×</button></div>)}</div> : <p className="linked-empty">{t('links.noLinkedTasks')}</p>}</section>
    <button className="delete-task" onClick={() => void remove()}>{t('notes.delete')}</button>
  </section>
}
