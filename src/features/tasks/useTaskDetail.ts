import { useCallback, useEffect, useState } from 'react'
import type { PriorityLevel, Task, TaskBucket } from '../../domain/models'
import { taskRepository } from './taskRepository'

export function useTaskDetail(id: string | undefined) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => { if (!id) { setLoading(false); return }; setTask((await taskRepository.get(id)) ?? null); setLoading(false) }, [id])
  useEffect(() => { void refresh() }, [refresh])
  const update = async (changes: Partial<Pick<Task, 'title' | 'description' | 'bucket' | 'dueDate'>>) => { if (!task) return; setTask(await taskRepository.update(task, changes)) }
  return {
    task, loading,
    update,
    complete: async () => { if (task) setTask(await taskRepository.complete(task)) },
    restore: async () => { if (task) setTask(await taskRepository.restore(task)) },
    changePriority: async (priority: PriorityLevel) => { if (task) setTask(await taskRepository.changePriority(task, priority)) },
    deleteTask: async () => { if (task) await taskRepository.delete(task) },
    setBucket: (bucket: TaskBucket) => update({ bucket }),
    setDueDate: (dueDate: string | null) => update({ dueDate }),
  }
}
