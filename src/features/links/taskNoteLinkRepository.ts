import { db } from '../../data/db'
import type { Note, Task, TaskBucket, TaskNoteLink } from '../../domain/models'

const timestamp = () => new Date().toISOString()
const active = (link: TaskNoteLink) => link.deletedAt === null || link.deletedAt === undefined

async function linksForTask(taskId: string) { return db.taskNoteLinks.where('taskId').equals(taskId).toArray() }
async function linksForNote(noteId: string) { return db.taskNoteLinks.where('noteId').equals(noteId).toArray() }

export const taskNoteLinkRepository = {
  async getNotesForTask(taskId: string) {
    const links = (await linksForTask(taskId)).filter(active)
    const notes = await Promise.all(links.map((link) => db.notes.get(link.noteId)))
    return notes.filter((note): note is Note => Boolean(note && !note.deletedAt)).sort((a, b) => a.title.localeCompare(b.title))
  },
  async getTasksForNote(noteId: string) {
    const links = (await linksForNote(noteId)).filter(active)
    const tasks = (await Promise.all(links.map((link) => db.tasks.get(link.taskId)))).filter((task): task is Task => Boolean(task && !task.deletedAt))
    return tasks.sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active') || a.title.localeCompare(b.title))
  },
  async getTaskIdsWithNotes(taskIds: string[]) {
    if (!taskIds.length) return new Set<string>()
    const links = await db.taskNoteLinks.where('taskId').anyOf(taskIds).toArray()
    const activeLinks = links.filter(active)
    const notes = await Promise.all(activeLinks.map((link) => db.notes.get(link.noteId)))
    const validNoteIds = new Set(notes.filter((note): note is Note => Boolean(note && !note.deletedAt)).map((note) => note.id))
    return new Set(activeLinks.filter((link) => validNoteIds.has(link.noteId)).map((link) => link.taskId))
  },
  async linkTaskToNote(taskId: string, noteId: string) {
    const matches = await db.taskNoteLinks.where('[taskId+noteId]').equals([taskId, noteId]).toArray()
    const existing = matches.find(active)
    if (existing) return existing
    const old = matches[0]
    if (old) { const restored = { ...old, deletedAt: null }; await db.taskNoteLinks.put(restored); return restored }
    const link: TaskNoteLink = { id: crypto.randomUUID(), taskId, noteId, createdAt: timestamp(), deletedAt: null }
    await db.taskNoteLinks.add(link)
    return link
  },
  async unlinkTaskFromNote(taskId: string, noteId: string) {
    const matches = await db.taskNoteLinks.where('[taskId+noteId]').equals([taskId, noteId]).toArray()
    const deletedAt = timestamp()
    await Promise.all(matches.filter(active).map((link) => db.taskNoteLinks.put({ ...link, deletedAt })))
  },
  async createNoteAndLink(taskId: string, title: string) {
    const now = timestamp()
    const note: Note = { id: crypto.randomUUID(), title: title.trim(), content: '', createdAt: now, updatedAt: now, deletedAt: null }
    const link: TaskNoteLink = { id: crypto.randomUUID(), taskId, noteId: note.id, createdAt: now, deletedAt: null }
    await db.transaction('rw', db.notes, db.taskNoteLinks, async () => { await db.notes.add(note); await db.taskNoteLinks.add(link) })
    return note
  },
  async createTaskAndLink(noteId: string, title: string, bucket: TaskBucket) {
    const now = timestamp()
    const task: Task = { id: crypto.randomUUID(), title: title.trim(), status: 'active', bucket, priorityBase: 1, priorityAgingStartedAt: now, description: '', dueDate: null, completedAt: null, createdAt: now, updatedAt: now, deletedAt: null }
    const link: TaskNoteLink = { id: crypto.randomUUID(), taskId: task.id, noteId, createdAt: now, deletedAt: null }
    await db.transaction('rw', db.tasks, db.taskNoteLinks, async () => { await db.tasks.add(task); await db.taskNoteLinks.add(link) })
    return task
  },
}
