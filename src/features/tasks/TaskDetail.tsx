import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../app/providers/AppSettingsProvider'
import type { PriorityLevel, TaskBucket } from '../../domain/models'
import { getEffectivePriority } from './taskUtils'
import { MarkdownField } from './MarkdownField'
import { useTaskDetail } from './useTaskDetail'
import { useNotes } from '../notes/useNotes'
import { LinkPicker } from '../links/LinkPicker'
import { useTaskNoteLinks } from '../links/useTaskNoteLinks'

const priorityColors = { 1: 'priority-green', 2: 'priority-yellow', 3: 'priority-orange', 4: 'priority-red' } as const

function formatDate(value: string | null | undefined, language: string) {
  return value ? new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—'
}

function PriorityControl({ value, onChange }: { value: PriorityLevel; onChange: (value: PriorityLevel) => void }) {
  const { t } = useTranslation()
  const names = { 1: t('taskDetail.priorityGreen'), 2: t('taskDetail.priorityYellow'), 3: t('taskDetail.priorityOrange'), 4: t('taskDetail.priorityRed') } as const
  return <div className="priority-control" role="group" aria-label={t('taskDetail.priority')}>{([1, 2, 3, 4] as PriorityLevel[]).map((level) => <button key={level} aria-label={names[level]} className={`priority-choice ${priorityColors[level]} ${level === value ? 'selected' : ''}`} onClick={() => onChange(level)} />)}</div>
}

export function TaskDetail() {
  const { t, i18n } = useTranslation()
  const { taskId } = useParams()
  const navigate = useNavigate()
  const settings = useAppSettings()
  const { task, loading, update, complete, restore, changePriority, deleteTask, setBucket, setDueDate } = useTaskDetail(taskId)
  const { notes: linkedNotes, linkNote, unlinkNote, createNote } = useTaskNoteLinks({ taskId })
  const { notes: allNotes } = useNotes()
  const [showNotePicker, setShowNotePicker] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialized, setInitialized] = useState(false)
  useEffect(() => { if (task && !initialized) { setTitle(task.title); setDescription(task.description); setInitialized(true) } }, [task, initialized])
  if (loading) return <section className="detail-page"><p className="muted-text">{t('taskDetail.loading')}</p></section>
  if (!task || task.deletedAt) return <section className="detail-page not-found"><button className="back-link" onClick={() => navigate('/tasks')}>← {t('taskDetail.backToTasks')}</button><h1>{t('taskDetail.notFound')}</h1></section>
  const priority = getEffectivePriority(task, settings)
  const saveTitle = async () => { const next = title.trim(); if (next && next !== task.title) await update({ title: next }); else if (!next) setTitle(task.title) }
  const saveDescription = async () => { if (description !== task.description) await update({ description }) }
  const handleDelete = async () => { if (window.confirm(t('taskDetail.confirmDelete'))) { await deleteTask(); navigate('/tasks') } }
  const availableNotes = allNotes.filter((note) => !linkedNotes.some((linked) => linked.id === note.id))
  return <section className="detail-page">
    <button className="back-link" onClick={() => navigate('/tasks')}>← {t('taskDetail.backToTasks')}</button>
    <div className="detail-title-row"><button className="task-check detail-check" aria-label={task.status === 'completed' ? t('taskDetail.restore') : t('taskDetail.complete')} onClick={task.status === 'completed' ? () => void restore() : () => void complete()}>{task.status === 'completed' ? '✓' : '○'}</button><input className={`detail-title-input ${task.status === 'completed' ? 'completed-title' : ''}`} value={title} onChange={(event: { target: HTMLInputElement }) => setTitle(event.target.value)} onBlur={() => void saveTitle()} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') void saveTitle(); if (event.key === 'Escape') setTitle(task.title) }} /></div>
    <div className="detail-grid"><div><span className="detail-label">{t('taskDetail.status')}</span><div className="segmented-control"><button className={task.bucket === 'today' ? 'selected' : ''} onClick={() => void setBucket('today')}>{t('tasks.today')}</button><button className={task.bucket === 'later' ? 'selected' : ''} onClick={() => void setBucket('later')}>{t('tasks.later')}</button></div></div><div><span className="detail-label">{t('taskDetail.priority')}</span><PriorityControl value={priority} onChange={(next) => void changePriority(next)} /></div></div>
    <div className="dates-row"><div><span className="detail-label">{t('taskDetail.created')}</span><span>{formatDate(task.createdAt, i18n.language)}</span></div><label><span className="detail-label">{t('taskDetail.due')}</span><input type="date" value={task.dueDate ? task.dueDate.slice(0, 10) : ''} onChange={(event: { target: HTMLInputElement }) => void setDueDate(event.target.value || null)} /></label><div><span className="detail-label">{t('taskDetail.completed')}</span><span>{formatDate(task.completedAt, i18n.language)}</span></div></div>
    <MarkdownField value={description} onChange={setDescription} onBlur={() => void saveDescription()} />
    <section className="linked-section"><div className="linked-heading"><h2>{t('links.linkedNotes')}</h2><button className="linked-add" aria-label={t('links.linkNote')} onClick={() => setShowNotePicker(!showNotePicker)}>+</button></div>{showNotePicker && <LinkPicker title={t('links.linkNote')} searchPlaceholder={t('links.searchNotes')} items={availableNotes.map((note) => ({ id: note.id, title: note.title }))} emptyLabel={t('links.noNotesAvailable')} createLabel={t('links.createNote')} onSelect={(id) => { void linkNote(id); setShowNotePicker(false) }} onCreate={async () => { const created = await createNote(task.title); if (created) navigate(`/notes/${created.id}`) }} onClose={() => setShowNotePicker(false)} />}{linkedNotes.length ? <div className="linked-list">{linkedNotes.map((note) => <div className="linked-row" key={note.id}><button onClick={() => navigate(`/notes/${note.id}`)}><span className="note-mark">▤</span>{note.title}<span className="linked-chevron">›</span></button><button className="unlink-button" aria-label={`${t('links.unlink')} ${note.title}`} onClick={() => void unlinkNote(note.id)}>×</button></div>)}</div> : <p className="linked-empty">{t('links.noLinkedNotes')}</p>}</section>
    <button className="delete-task" onClick={() => void handleDelete()}>{t('taskDetail.delete')}</button>
  </section>
}
