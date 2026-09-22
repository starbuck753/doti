import type { PriorityLevel, Task } from '../../domain/models'

const MAX_PRIORITY: PriorityLevel = 4

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
