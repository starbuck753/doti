import { useCallback, useEffect, useState } from 'react'
import type { Note, Task, TaskBucket } from '../../domain/models'
import { taskNoteLinkRepository } from './taskNoteLinkRepository'

export function useTaskNoteLinks({ taskId, noteId }: { taskId?: string; noteId?: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const refresh = useCallback(async () => {
    if (taskId) setNotes(await taskNoteLinkRepository.getNotesForTask(taskId))
    if (noteId) setTasks(await taskNoteLinkRepository.getTasksForNote(noteId))
  }, [taskId, noteId])
  useEffect(() => { void refresh() }, [refresh])
  return {
    notes, tasks, refresh,
    linkNote: async (noteIdToLink: string) => { if (taskId) { await taskNoteLinkRepository.linkTaskToNote(taskId, noteIdToLink); await refresh() } },
    unlinkNote: async (noteIdToUnlink: string) => { if (taskId) { await taskNoteLinkRepository.unlinkTaskFromNote(taskId, noteIdToUnlink); await refresh() } },
    createNote: async (title: string) => { if (!taskId) return null; const note = await taskNoteLinkRepository.createNoteAndLink(taskId, title); await refresh(); return note },
    linkTask: async (taskIdToLink: string) => { if (noteId) { await taskNoteLinkRepository.linkTaskToNote(taskIdToLink, noteId); await refresh() } },
    unlinkTask: async (taskIdToUnlink: string) => { if (noteId) { await taskNoteLinkRepository.unlinkTaskFromNote(taskIdToUnlink, noteId); await refresh() } },
    createTask: async (title: string, bucket: TaskBucket) => { if (!noteId) return null; const task = await taskNoteLinkRepository.createTaskAndLink(noteId, title, bucket); await refresh(); return task },
  }
}

export function useTaskLinkIndicators(taskIds: string[]) {
  const [taskIdsWithNotes, setTaskIdsWithNotes] = useState<Set<string>>(new Set())
  const key = taskIds.join('|')
  useEffect(() => { void taskNoteLinkRepository.getTaskIdsWithNotes(taskIds).then(setTaskIdsWithNotes) }, [key])
  return { taskIdsWithNotes }
}
