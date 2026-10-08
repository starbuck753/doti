import type { PriorityLevel, Task } from '../../domain/models'

const MAX_PRIORITY: PriorityLevel = 4

export function getDaysUntilDueDate(dueDate: string, now = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate)
  if (!match) return null
  const [, year, month, day] = match
  const dueDay = Date.UTC(Number(year), Number(month) - 1, Number(day))
  const validDate = new Date(dueDay)
  if (validDate.getUTCFullYear() !== Number(year) || validDate.getUTCMonth() !== Number(month) - 1 || validDate.getUTCDate() !== Number(day)) return null
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return (dueDay - today) / 86_400_000
}

export function getEffectivePriority(task: Task, settings: { priorityAgingEnabled: boolean; priorityAgingIntervalDays: number }, now = new Date()): PriorityLevel {
  if (!settings.priorityAgingEnabled || task.status !== 'active') return task.priorityBase
  const started = new Date(task.priorityAgingStartedAt).getTime()
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - started) / 86_400_000))
  const interval = Math.max(1, settings.priorityAgingIntervalDays)
  return Math.min(task.priorityBase + Math.floor(elapsedDays / interval), MAX_PRIORITY) as PriorityLevel
}

export function sortTasksForDashboard(tasks: Task[], settings: { priorityAgingEnabled: boolean; priorityAgingIntervalDays: number }, now = new Date()) {
  return [...tasks].sort((a, b) => {
    const aPending = a.status === 'active'
    const bPending = b.status === 'active'
    if (aPending !== bPending) return aPending ? -1 : 1
    if (aPending) {
      const priorityDiff = getEffectivePriority(b, settings, now) - getEffectivePriority(a, settings, now)
      if (priorityDiff) return priorityDiff
    }
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export function isCompletedToday(completedAt: string | null, now = new Date()) {
  if (!completedAt) return false
  const completed = new Date(completedAt)
  return completed.getFullYear() === now.getFullYear() && completed.getMonth() === now.getMonth() && completed.getDate() === now.getDate()
}
