import Dexie, { type EntityTable } from 'dexie'
import type { Birthday, Note, Settings, Task, TaskNoteLink } from '../domain/models'

export class DotiDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  notes!: EntityTable<Note, 'id'>
  birthdays!: EntityTable<Birthday, 'id'>
  taskNoteLinks!: EntityTable<TaskNoteLink, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor() {
    super('doti-db')
    this.version(1).stores({
      tasks: 'id, status, dueDate, createdAt, updatedAt',
      notes: 'id, createdAt, updatedAt',
      birthdays: 'id, date, name',
      taskNoteLinks: 'id, taskId, noteId, [taskId+noteId]',
      settings: 'id',
    })
    this.version(2).stores({
      tasks: 'id, status, bucket, priorityBase, dueDate, createdAt, updatedAt',
      notes: 'id, createdAt, updatedAt',
      birthdays: 'id, date, name',
      taskNoteLinks: 'id, taskId, noteId, [taskId+noteId]',
      settings: 'id',
    }).upgrade((transaction) => {
      return transaction.table('tasks').toCollection().modify((task) => {
        const now = new Date().toISOString()
        task.bucket ??= 'today'
        task.priorityBase ??= 1
        task.priorityAgingStartedAt ??= task.createdAt ?? now
        task.description ??= ''
        task.dueDate ??= null
        task.completedAt ??= task.status === 'completed' ? now : null
        task.deletedAt ??= null
      })
    })
  }
}

export const db = new DotiDatabase()

export const defaultSettings: Settings = {
  id: 'app',
  language: 'en',
  theme: 'light',
  priorityAgingEnabled: true,
  priorityAgingIntervalDays: 7,
  updatedAt: new Date().toISOString(),
}
