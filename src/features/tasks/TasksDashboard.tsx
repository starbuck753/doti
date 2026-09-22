import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../app/providers/AppSettingsProvider'
import type { PriorityLevel, Task, TaskBucket } from '../../domain/models'
import { getEffectivePriority, sortTasksForDashboard } from './taskUtils'
import { useTasks } from './useTasks'

const priorityColors = { 1: 'priority-green', 2: 'priority-yellow', 3: 'priority-orange', 4: 'priority-red' } as const

function TaskRow({ task, onComplete, onRestore, onPriority }: { key?: string; task: Task; onComplete: () => void; onRestore: () => void; onPriority: (priority: PriorityLevel) => void }) {
  const { priorityAgingEnabled, priorityAgingIntervalDays } = useAppSettings()
  const priority = getEffectivePriority(task, { priorityAgingEnabled, priorityAgingIntervalDays })
  const cyclePriority = () => onPriority((priority % 4 + 1) as PriorityLevel)
  return <div className={`task-row ${task.status === 'completed' ? 'completed' : ''}`}>
    <button className="task-check" aria-label={task.status === 'completed' ? 'Restore task' : 'Complete task'} onClick={task.status === 'completed' ? onRestore : onComplete}>{task.status === 'completed' ? '✓' : '○'}</button>
    <span className="task-title">{task.title}</span>
    {task.status === 'active' && <button className={`priority-dot ${priorityColors[priority]}`} aria-label="Change priority" onClick={cyclePriority} />}
  </div>
}

function TaskSection({ bucket, tasks, onAdd, onComplete, onRestore, onPriority }: { bucket: TaskBucket; tasks: Task[]; onAdd: (title: string) => Promise<void>; onComplete: (task: Task) => void; onRestore: (task: Task) => void; onPriority: (task: Task, priority: PriorityLevel) => void }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const submit = async () => { if (!title.trim()) return; await onAdd(title); setTitle(''); setAdding(false) }
  return <section className="task-section">
    <div className="section-heading"><h2>{t(`tasks.${bucket}`)}</h2><button className="add-button" aria-label={t('tasks.add')} onClick={() => setAdding(true)}>+</button></div>
    {adding && <input autoFocus className="quick-add" value={title} onChange={(event: { target: HTMLInputElement }) => setTitle(event.target.value)} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') void submit(); if (event.key === 'Escape') setAdding(false) }} placeholder={t('tasks.quickAdd')} />}
    <div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} onComplete={() => onComplete(task)} onRestore={() => onRestore(task)} onPriority={(priority) => onPriority(task, priority)} />)}</div>
  </section>
}

export function TasksDashboard() {
  const { t, i18n } = useTranslation()
  const { tasks, addTask, completeTask, restoreTask, changePriority } = useTasks()
  const settings = useAppSettings()
  const sorted = sortTasksForDashboard(tasks, settings)
  const date = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  return <section className="tasks-page"><p className="eyebrow">Doti</p><h1>{t('navigation.tasks')}</h1><p className="current-date">{date}</p>
    <TaskSection bucket="today" tasks={sorted.filter((task) => task.bucket === 'today')} onAdd={(title) => addTask(title, 'today')} onComplete={completeTask} onRestore={restoreTask} onPriority={changePriority} />
    <TaskSection bucket="later" tasks={sorted.filter((task) => task.bucket === 'later')} onAdd={(title) => addTask(title, 'later')} onComplete={completeTask} onRestore={restoreTask} onPriority={changePriority} />
    <section className="upcoming-placeholder"><h2>{t('tasks.upcomingBirthdays')}</h2><p>{t('placeholder')}</p></section>
  </section>
}
