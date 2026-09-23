import { db, defaultSettings } from '../../data/db'
import type { Birthday, Note, Settings, Task, TaskNoteLink } from '../../domain/models'

export const DotiBackupVersion = 1 as const
const BACKUP_FORMAT = 'doti-backup' as const

export interface DotiBackupV1 {
  format: typeof BACKUP_FORMAT
  version: typeof DotiBackupVersion
  exportedAt: string
  data: { tasks: Task[]; notes: Note[]; birthdays: Birthday[]; taskNoteLinks: TaskNoteLink[]; settings: Settings }
}

export class BackupValidationError extends Error {
  code: 'invalid' | 'newer'
  constructor(message: string, code: 'invalid' | 'newer' = 'invalid') { super(message); this.code = code }
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const requiredString = (record: Record<string, unknown>, field: string) => typeof record[field] === 'string' && record[field] !== ''
const requiredNumber = (record: Record<string, unknown>, field: string) => typeof record[field] === 'number' && Number.isFinite(record[field])

function normalizeTask(value: unknown): Task {
  if (!isRecord(value) || !requiredString(value, 'id') || !requiredString(value, 'title') || !requiredString(value, 'bucket') || !requiredNumber(value, 'priorityBase') || !requiredString(value, 'createdAt') || !requiredString(value, 'updatedAt')) throw new BackupValidationError('Invalid task record')
  if (value.bucket !== 'today' && value.bucket !== 'later') throw new BackupValidationError('Invalid task bucket')
  if (![1, 2, 3, 4].includes(value.priorityBase as number)) throw new BackupValidationError('Invalid task priority')
  return { id: value.id as string, title: value.title as string, status: value.status === 'completed' ? 'completed' : value.status === 'archived' ? 'archived' : 'active', bucket: value.bucket, priorityBase: value.priorityBase as Task['priorityBase'], priorityAgingStartedAt: typeof value.priorityAgingStartedAt === 'string' ? value.priorityAgingStartedAt : value.createdAt as string, description: typeof value.description === 'string' ? value.description : '', dueDate: typeof value.dueDate === 'string' ? value.dueDate : null, completedAt: typeof value.completedAt === 'string' ? value.completedAt : null, createdAt: value.createdAt as string, updatedAt: value.updatedAt as string, deletedAt: typeof value.deletedAt === 'string' ? value.deletedAt : null }
}

function normalizeNote(value: unknown): Note {
  if (!isRecord(value) || !requiredString(value, 'id') || !requiredString(value, 'title') || typeof value.content !== 'string' || !requiredString(value, 'createdAt') || !requiredString(value, 'updatedAt')) throw new BackupValidationError('Invalid note record')
  return { id: value.id as string, title: value.title as string, content: value.content, createdAt: value.createdAt as string, updatedAt: value.updatedAt as string, deletedAt: typeof value.deletedAt === 'string' ? value.deletedAt : null }
}

function normalizeBirthday(value: unknown): Birthday {
  if (!isRecord(value) || !requiredString(value, 'id') || !requiredString(value, 'name') || !requiredNumber(value, 'month') || !requiredNumber(value, 'day')) throw new BackupValidationError('Invalid birthday record')
  const month = value.month as number
  const day = value.day as number
  if (month < 1 || month > 12 || day < 1 || day > 31) throw new BackupValidationError('Invalid birthday date')
  return { id: value.id as string, name: value.name as string, month, day, createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(), updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(), deletedAt: typeof value.deletedAt === 'string' ? value.deletedAt : null }
}

function normalizeLink(value: unknown, exportedAt: string): TaskNoteLink {
  if (!isRecord(value) || !requiredString(value, 'id') || !requiredString(value, 'taskId') || !requiredString(value, 'noteId')) throw new BackupValidationError('Invalid task-note link record')
  return { id: value.id as string, taskId: value.taskId as string, noteId: value.noteId as string, createdAt: typeof value.createdAt === 'string' ? value.createdAt : exportedAt, deletedAt: typeof value.deletedAt === 'string' ? value.deletedAt : null }
}

function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value) || value.id !== 'app' || (value.language !== 'en' && value.language !== 'es') || !['system', 'light', 'dark'].includes(value.theme as string) || typeof value.priorityAgingEnabled !== 'boolean' || !requiredNumber(value, 'priorityAgingIntervalDays')) throw new BackupValidationError('Invalid settings record')
  const accentColor = ['blue', 'purple', 'pink', 'green', 'orange', 'teal'].includes(value.accentColor as string) ? value.accentColor : defaultSettings.accentColor
  return { id: 'app', language: value.language as Settings['language'], theme: value.theme as Settings['theme'], accentColor: accentColor as Settings['accentColor'], priorityAgingEnabled: value.priorityAgingEnabled, priorityAgingIntervalDays: value.priorityAgingIntervalDays as number, updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString() }
}

export function validateBackup(value: unknown): DotiBackupV1 {
  if (!isRecord(value) || value.format !== BACKUP_FORMAT || typeof value.version !== 'number') throw new BackupValidationError('Invalid Doti backup')
  if (value.version > DotiBackupVersion) throw new BackupValidationError('Newer Doti backup', 'newer')
  if (value.version !== DotiBackupVersion || !requiredString(value, 'exportedAt') || !isRecord(value.data)) throw new BackupValidationError('Invalid Doti backup')
  const data = value.data
  if (!Array.isArray(data.tasks) || !Array.isArray(data.notes) || !Array.isArray(data.birthdays) || !Array.isArray(data.taskNoteLinks) || data.settings === undefined) throw new BackupValidationError('Invalid Doti backup')
  const tasks = data.tasks.map(normalizeTask)
  const notes = data.notes.map(normalizeNote)
  const birthdays = data.birthdays.map(normalizeBirthday)
  const taskNoteLinks = data.taskNoteLinks.map((link) => normalizeLink(link, value.exportedAt as string))
  const taskIds = new Set(tasks.map((task) => task.id))
  const noteIds = new Set(notes.map((note) => note.id))
  if (taskNoteLinks.some((link) => link.deletedAt === null && (!taskIds.has(link.taskId) || !noteIds.has(link.noteId)))) throw new BackupValidationError('Invalid active task-note link')
  return { format: BACKUP_FORMAT, version: DotiBackupVersion, exportedAt: value.exportedAt as string, data: { tasks, notes, birthdays, taskNoteLinks, settings: normalizeSettings(data.settings) } }
}

export async function createBackup(): Promise<DotiBackupV1> {
  const [tasks, notes, birthdays, taskNoteLinks, storedSettings] = await Promise.all([db.tasks.toArray(), db.notes.toArray(), db.birthdays.toArray(), db.taskNoteLinks.toArray(), db.settings.get('app')])
  return { format: BACKUP_FORMAT, version: DotiBackupVersion, exportedAt: new Date().toISOString(), data: { tasks, notes, birthdays, taskNoteLinks, settings: storedSettings ?? defaultSettings } }
}

export function downloadBackup(backup: DotiBackupV1) {
  const json = JSON.stringify(backup, null, 2)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `doti-backup-${date}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export async function restoreBackup(backup: DotiBackupV1) {
  await db.transaction('rw', db.tasks, db.notes, db.birthdays, db.taskNoteLinks, db.settings, async () => {
    await db.taskNoteLinks.clear()
    await db.tasks.clear()
    await db.notes.clear()
    await db.birthdays.clear()
    await db.tasks.bulkAdd(backup.data.tasks)
    await db.notes.bulkAdd(backup.data.notes)
    await db.birthdays.bulkAdd(backup.data.birthdays)
    await db.taskNoteLinks.bulkAdd(backup.data.taskNoteLinks)
    await db.settings.clear()
    await db.settings.add(backup.data.settings)
  })
}

export async function readBackupFile(file: File) {
  const parsed: unknown = JSON.parse(await file.text())
  return validateBackup(parsed)
}
