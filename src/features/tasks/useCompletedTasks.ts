import { useCallback, useEffect, useState } from 'react'
import type { Task } from '../../domain/models'
import { taskRepository } from './taskRepository'

export function useCompletedTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const refresh = useCallback(async () => setTasks(await taskRepository.listCompleted()), [])
  useEffect(() => { void refresh() }, [refresh])
  return { tasks, refresh, restoreFromHistory: async (task: Task) => { await taskRepository.restoreFromHistory(task); await refresh() } }
}
