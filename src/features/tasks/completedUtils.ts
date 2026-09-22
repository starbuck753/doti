import type { Task } from '../../domain/models'

export function localDateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` }

export function groupCompletedTasksByDate(tasks: Task[], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const groups = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!task.completedAt) continue
    const date = new Date(task.completedAt)
    const key = localDateKey(date)
    const list = groups.get(key) ?? []
    list.push(task)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([key, groupedTasks]) => {
    const [year, month, day] = key.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return { key, date, tasks: groupedTasks, isToday: localDateKey(date) === localDateKey(today), isYesterday: localDateKey(date) === localDateKey(yesterday) }
  }).sort((a, b) => b.date.getTime() - a.date.getTime())
}
