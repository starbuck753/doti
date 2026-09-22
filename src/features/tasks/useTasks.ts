import { useCallback, useEffect, useState } from 'react'
import type { PriorityLevel, Task, TaskBucket } from '../../domain/models'
import { taskRepository } from './taskRepository'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const refresh = useCallback(async () => setTasks(await taskRepository.listDashboard()), [])
  useEffect(() => { void refresh() }, [refresh])
  const update = async (operation: () => Promise<Task>) => { await operation(); await refresh() }
  return {
    tasks,
    addTask: async (title: string, bucket: TaskBucket) => { if (title.trim()) await update(() => taskRepository.create(title, bucket)) },
    completeTask: (task: Task) => update(() => taskRepository.complete(task)),
    restoreTask: (task: Task) => update(() => taskRepository.restore(task)),
    changePriority: (task: Task, priority: PriorityLevel) => update(() => taskRepository.changePriority(task, priority)),
  }
}
