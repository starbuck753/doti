import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Circle, CircleCheck, EllipsisVertical, Plus, SquareText } from 'lucide-react'
import { useAppSettings } from '../../app/providers/AppSettingsProvider'
import { DotiBrand } from '../../app/DotiBrand'
import type { PriorityLevel, Task, TaskBucket } from '../../domain/models'
import { getEffectivePriority, sortTasksForDashboard } from './taskUtils'
import { useTasks } from './useTasks'
import { UpcomingBirthdays } from '../birthdays/BirthdaysPage'
import { useTaskLinkIndicators } from '../links/useTaskNoteLinks'

const priorityColors = { 1: 'priority-green', 2: 'priority-yellow', 3: 'priority-orange', 4: 'priority-red' } as const

function PlusIcon() {
  return <Plus aria-hidden="true" />
}

function MoreIcon() {
  return <EllipsisVertical aria-hidden="true" />
}

function CheckIcon() {
  return <CircleCheck aria-hidden="true" />
}

function CircleIcon() {
  return <Circle aria-hidden="true" />
}

function FileTextIcon() {
  return <SquareText aria-hidden="true" />
}

function MoveIcon({ bucket }: { bucket: TaskBucket }) {
  return bucket === 'today' ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />
}

function TasksOverflowMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return <div className="tasks-overflow"><button type="button" className="overflow-button" aria-label={t('tasks.more')} aria-expanded={open} onClick={() => setOpen(!open)}><MoreIcon /></button>{open && <div className="overflow-menu"><Link to="/completed" onClick={() => setOpen(false)}>{t('completed.title')}</Link><Link to="/settings" onClick={() => setOpen(false)}>{t('navigation.settings')}</Link></div>}</div>
}

function TaskRow({ task, hasLinkedNotes, onComplete, onRestore, onMove, onPriority }: { key?: string; task: Task; hasLinkedNotes: boolean; onComplete: () => void; onRestore: () => void; onMove: () => void; onPriority: (priority: PriorityLevel) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { priorityAgingEnabled, priorityAgingIntervalDays } = useAppSettings()
  const priority = getEffectivePriority(task, { priorityAgingEnabled, priorityAgingIntervalDays })
  const cyclePriority = () => onPriority((priority % 4 + 1) as PriorityLevel)
  // const hasDetails = task.description.trim().length > 0 || hasLinkedNotes
  const hasDetails = hasLinkedNotes

  return <div className={`task-row ${task.status === 'completed' ? 'completed' : ''}`} role="button" tabIndex={0} onClick={() => navigate(`/tasks/${task.id}`)} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') navigate(`/tasks/${task.id}`) }}>
    <button type="button" className="task-check" aria-label={task.status === 'completed' ? t('taskDetail.restore') : t('taskDetail.complete')} onClick={(event: { stopPropagation: () => void }) => { event.stopPropagation(); (task.status === 'completed' ? onRestore : onComplete)() }}>{task.status === 'completed' ? <CheckIcon /> : <CircleIcon />}</button>
    <span className="task-title">{task.title}</span>
    {/* Description indicator disabled while task descriptions are hidden from the UI. */}
    {hasDetails && <span className="details-indicator" aria-label={t('links.linkedNotes')}><FileTextIcon /></span>}
    <button type="button" className="task-move" aria-label={t(task.bucket === 'today' ? 'taskDetail.moveToLater' : 'taskDetail.moveToToday')} onClick={(event: { stopPropagation: () => void }) => { event.stopPropagation(); onMove() }}><MoveIcon bucket={task.bucket} /></button>
    {task.status === 'active' && <button type="button" className={`priority-dot ${priorityColors[priority]}`} aria-label={t('taskDetail.changePriority')} onClick={(event: { stopPropagation: () => void }) => { event.stopPropagation(); cyclePriority() }} />}
  </div>
}

function TaskSection({ bucket, tasks, linkedTaskIds, onAdd, onComplete, onRestore, onMove, onPriority }: { bucket: TaskBucket; tasks: Task[]; linkedTaskIds: Set<string>; onAdd: (title: string) => Promise<void>; onComplete: (task: Task) => void; onRestore: (task: Task) => void; onMove: (task: Task) => void; onPriority: (task: Task, priority: PriorityLevel) => void }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const submit = async () => { if (!title.trim()) return; await onAdd(title); setTitle(''); setAdding(false) }
  return <section className="task-section">
    <div className="section-heading"><h2>{t(`tasks.${bucket}`)}</h2><button type="button" className="add-button" aria-label={t('tasks.add')} onClick={() => setAdding(true)}><PlusIcon /></button></div>
    {adding && <input autoFocus className="quick-add" value={title} onChange={(event: { target: HTMLInputElement }) => setTitle(event.target.value)} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') void submit(); if (event.key === 'Escape') setAdding(false) }} placeholder={t('tasks.quickAdd')} />}
    <div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} hasLinkedNotes={linkedTaskIds.has(task.id)} onComplete={() => onComplete(task)} onRestore={() => onRestore(task)} onMove={() => onMove(task)} onPriority={(priority) => onPriority(task, priority)} />)}</div>
  </section>
}

export function TasksDashboard() {
  const { t, i18n } = useTranslation()
  const { tasks, addTask, completeTask, restoreTask, moveTask, changePriority } = useTasks()
  const settings = useAppSettings()
  const { taskIdsWithNotes } = useTaskLinkIndicators(tasks.map((task) => task.id))
  const sorted = sortTasksForDashboard(tasks, settings)
  const date = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return <section className="tasks-page"><div className="tasks-page-heading"><div><p className="eyebrow"><DotiBrand /></p><h1>{t('navigation.tasks')}</h1><p className="current-date">{date}</p></div><TasksOverflowMenu /></div>
    <TaskSection bucket="today" tasks={sorted.filter((task) => task.bucket === 'today')} linkedTaskIds={taskIdsWithNotes} onAdd={(title) => addTask(title, 'today')} onComplete={completeTask} onRestore={restoreTask} onMove={(task) => moveTask(task, 'later')} onPriority={changePriority} />
    <TaskSection bucket="later" tasks={sorted.filter((task) => task.bucket === 'later')} linkedTaskIds={taskIdsWithNotes} onAdd={(title) => addTask(title, 'later')} onComplete={completeTask} onRestore={restoreTask} onMove={(task) => moveTask(task, 'today')} onPriority={changePriority} />
    <UpcomingBirthdays />
  </section>
}
