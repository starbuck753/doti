import { db } from '../../data/db'
import type { PriorityLevel, Task, TaskBucket } from '../../domain/models'

const now = () => new Date().toISOString()

export const taskRepository = {
  async listDashboard() {
    const tasks = await db.tasks.filter((task) => task.deletedAt === null || task.deletedAt === undefined).toArray()
    return tasks.filter((task) => task.status === 'active' || (task.completedAt ? new Date(task.completedAt).toDateString() === new Date().toDateString() : false))
  },
  async create(title: string, bucket: TaskBucket) {
    const timestamp = now()
    const task: Task = { id: crypto.randomUUID(), title: title.trim(), bucket, priorityBase: 1, priorityAgingStartedAt: timestamp, description: '', dueDate: null, completedAt: null, status: 'active', createdAt: timestamp, updatedAt: timestamp, deletedAt: null }
    await db.tasks.add(task)
    return task
  },
  async complete(task: Task) { const updated = { ...task, status: 'completed' as const, completedAt: now(), updatedAt: now() }; await db.tasks.put(updated); return updated },
  async restore(task: Task) { const updated = { ...task, status: 'active' as const, completedAt: null, updatedAt: now() }; await db.tasks.put(updated); return updated },
  async changePriority(task: Task, priority: PriorityLevel) { const timestamp = now(); const updated = { ...task, priorityBase: priority, priorityAgingStartedAt: timestamp, updatedAt: timestamp }; await db.tasks.put(updated); return updated },
}
