import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Task } from '../../domain/models'
import { useTaskLinkIndicators } from '../links/useTaskNoteLinks'
import { groupCompletedTasksByDate } from './completedUtils'
import { useCompletedTasks } from './useCompletedTasks'

function completionTime(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }

function CompletedRow({ task, hasLinkedNotes, onRestore }: { key?: string; task: Task; hasLinkedNotes: boolean; onRestore: () => void }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  return <div className="completed-row" role="button" tabIndex={0} onClick={() => navigate(`/tasks/${task.id}`)} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') navigate(`/tasks/${task.id}`) }}><button className="completed-check" aria-label={t('completed.restore')} onClick={(event: { stopPropagation: () => void }) => { event.stopPropagation(); onRestore() }}>✓</button><div className="completed-row-body"><span className="completed-title">{task.title}</span><span className="completed-time">{task.completedAt ? `${t('completed.completed')} ${completionTime(task.completedAt, i18n.language)}` : ''}</span></div>{(task.description.trim() || hasLinkedNotes) && <span className="details-indicator" aria-label={t('taskDetail.hasDescription')}>≡</span>}<span className="restore-action">↶</span></div>
}

export function CompletedTasksPage() {
  const { t, i18n } = useTranslation()
  const { tasks, restoreFromHistory } = useCompletedTasks()
  const { taskIdsWithNotes } = useTaskLinkIndicators(tasks.map((task) => task.id))
  const groups = groupCompletedTasksByDate(tasks)
  const dateLabel = (group: ReturnType<typeof groupCompletedTasksByDate>[number]) => group.isToday ? t('completed.today') : group.isYesterday ? t('completed.yesterday') : new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(group.date)
  return <section className="completed-page"><p className="eyebrow">Doti</p><h1>{t('completed.title')}</h1>{groups.length ? groups.map((group) => <section className="completed-group" key={group.key}><h2>{dateLabel(group)}</h2>{group.tasks.map((task) => <CompletedRow key={task.id} task={task} hasLinkedNotes={taskIdsWithNotes.has(task.id)} onRestore={() => void restoreFromHistory(task)} />)}</section>) : <p className="completed-empty">{t('completed.empty')}</p>}</section>
}
