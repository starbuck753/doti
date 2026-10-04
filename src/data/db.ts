import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Birthday, Habit, HabitCheck, Note, Settings, Task, TaskNoteLink } from '../domain/models'
import type { SyncMeta, SyncState } from '../sync/types'

export class DotiDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  notes!: EntityTable<Note, 'id'>
  birthdays!: EntityTable<Birthday, 'id'>
  taskNoteLinks!: EntityTable<TaskNoteLink, 'id'>
  settings!: EntityTable<Settings, 'id'>
  habits!: EntityTable<Habit, 'id'>
  habitChecks!: EntityTable<HabitCheck, 'id'>
  syncState!: EntityTable<SyncState, 'id'>
  syncMeta!: Table<SyncMeta, [string, string]>

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
    this.version(6).stores({
      tasks: 'id, status, bucket, priorityBase, dueDate, createdAt, updatedAt',
      notes: 'id, createdAt, updatedAt, deletedAt',
      birthdays: 'id, month, day, name, updatedAt',
      taskNoteLinks: 'id, taskId, noteId, deletedAt, [taskId+noteId]',
      settings: 'id',
    }).upgrade((transaction) => transaction.table('settings').toCollection().modify((settings) => {
      settings.theme ??= 'system'
      settings.accentColor ??= 'green'
      settings.priorityAgingEnabled ??= true
      settings.priorityAgingIntervalDays ??= 7
    }))
    this.version(7).stores({
      tasks: 'id, status, bucket, priorityBase, dueDate, createdAt, updatedAt, deletedAt',
      notes: 'id, createdAt, updatedAt, deletedAt',
      birthdays: 'id, month, day, name, updatedAt, deletedAt',
      taskNoteLinks: 'id, taskId, noteId, updatedAt, deletedAt, [taskId+noteId]',
      settings: 'id, updatedAt',
      syncState: 'id, currentUserId, lastPullCursor',
      syncMeta: '[entityType+entityId], entityType, entityId, lastSyncedLocalUpdatedAt',
    }).upgrade((transaction) => transaction.table('taskNoteLinks').toCollection().modify((link) => {
      link.updatedAt ??= link.deletedAt ?? link.createdAt ?? new Date().toISOString()
    }))
    this.version(8).stores({
      tasks: 'id, status, bucket, priorityBase, dueDate, createdAt, updatedAt, deletedAt',
      notes: 'id, createdAt, updatedAt, deletedAt',
      birthdays: 'id, month, day, name, updatedAt, deletedAt',
      taskNoteLinks: 'id, taskId, noteId, updatedAt, deletedAt, [taskId+noteId]',
      settings: 'id, updatedAt',
      syncState: 'id, currentUserId, lastPullCursor',
      syncMeta: '[entityType+entityId], entityType, entityId, lastSyncedLocalUpdatedAt',
      habits: 'id, createdAt, updatedAt, deletedAt',
      habitChecks: 'id, habitId, date, [habitId+date], updatedAt, deletedAt',
    }).upgrade((transaction) => transaction.table('settings').toCollection().modify((settings) => {
      settings.showHabitsOnDashboard ??= true
    }))
    this.version(9).stores({
      tasks: 'id, status, bucket, priorityBase, dueDate, createdAt, updatedAt, deletedAt',
      notes: 'id, createdAt, updatedAt, deletedAt',
      birthdays: 'id, month, day, name, updatedAt, deletedAt',
      taskNoteLinks: 'id, taskId, noteId, updatedAt, deletedAt, [taskId+noteId]',
      settings: 'id, updatedAt',
      syncState: 'id, currentUserId, lastPullCursor',
      syncMeta: '[entityType+entityId], entityType, entityId, lastSyncedLocalUpdatedAt',
      habits: 'id, createdAt, updatedAt, deletedAt',
      habitChecks: 'id, habitId, date, [habitId+date], updatedAt, deletedAt',
    }).upgrade((transaction) => transaction.table('habits').toCollection().modify((habit) => {
      if (habit.icon === 'circle-check-big') habit.icon = 'circle-checked-big'
    }))
  }
}

export const db = new DotiDatabase()

export const defaultSettings: Settings = {
  id: 'app',
  language: 'en',
  theme: 'system',
  accentColor: 'green',
  priorityAgingEnabled: true,
  priorityAgingIntervalDays: 7,
  showHabitsOnDashboard: true,
  updatedAt: new Date().toISOString(),
}
