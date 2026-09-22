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
      birthdays: 'id, month, day, name, updatedAt',
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
    this.version(3).stores({
      tasks: 'id, status, bucket, priorityBase, dueDate, createdAt, updatedAt',
      notes: 'id, createdAt, updatedAt',
      birthdays: 'id, month, day, name, updatedAt',
      taskNoteLinks: 'id, taskId, noteId, [taskId+noteId]',
      settings: 'id',
    }).upgrade((transaction) => transaction.table('birthdays').toCollection().modify((birthday) => {
      if (birthday.month === undefined && birthday.date) {
        const parsed = new Date(birthday.date)
        birthday.month = parsed.getMonth() + 1
        birthday.day = parsed.getDate()
      }
      birthday.deletedAt ??= null
      delete birthday.date
      delete birthday.notes
    }))
    this.version(4).stores({
      tasks: 'id, status, bucket, priorityBase, dueDate, createdAt, updatedAt',
      notes: 'id, createdAt, updatedAt, deletedAt',
      birthdays: 'id, month, day, name, updatedAt',
      taskNoteLinks: 'id, taskId, noteId, [taskId+noteId]',
      settings: 'id',
    }).upgrade((transaction) => transaction.table('notes').toCollection().modify((note) => {
      note.deletedAt ??= null
    }))
    this.version(5).stores({
      tasks: 'id, status, bucket, priorityBase, dueDate, createdAt, updatedAt',
      notes: 'id, createdAt, updatedAt, deletedAt',
      birthdays: 'id, month, day, name, updatedAt',
      taskNoteLinks: 'id, taskId, noteId, deletedAt, [taskId+noteId]',
      settings: 'id',
    }).upgrade((transaction) => transaction.table('taskNoteLinks').toCollection().modify((link) => {
      link.deletedAt ??= null
    }))
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
