import type { Birthday, Note, Settings, Task, TaskNoteLink } from '../domain/models'
import type { PullChanges, PushResult, SyncChanges, SyncProvider } from './types'
import { supabase } from './supabaseClient'

type Row = Record<string, unknown>
const asRow = (value: unknown): Row => value && typeof value === 'object' ? value as Row : {}
const text = (row: Row, key: string) => typeof row[key] === 'string' ? row[key] as string : null
const number = (row: Row, key: string) => typeof row[key] === 'number' ? row[key] as number : null
const boolean = (row: Row, key: string) => typeof row[key] === 'boolean' ? row[key] as boolean : null
const validIso = (value: string | null, fallback: string) => value && !Number.isNaN(Date.parse(value)) ? value : fallback
const toDateOrNull = (value: string | null) => value && !Number.isNaN(Date.parse(value)) ? value : null

function requireClient() { if (!supabase) throw new Error('Supabase is not configured'); return supabase }
function maxCursor(rows: Row[], current: string | null) {
  return rows.map((row) => text(row, 'server_updated_at')).filter((value): value is string => Boolean(value)).reduce<string | null>((max, value) => !max || value > max ? value : max, current)
}

function taskFrom(row: Row): Task | null {
  const now = new Date().toISOString(); const id = text(row, 'id'); const title = text(row, 'title'); const status = text(row, 'status'); const bucket = text(row, 'bucket'); const priorityBase = number(row, 'priority_base')
  if (!id || title === null || !['active', 'completed', 'archived'].includes(status ?? '') || !['today', 'later'].includes(bucket ?? '') || ![1, 2, 3, 4].includes(priorityBase ?? 0)) return null
  const createdAt = validIso(text(row, 'created_at'), now); const updatedAt = validIso(text(row, 'updated_at'), createdAt)
  return { id, title, status: status as Task['status'], bucket: bucket as Task['bucket'], priorityBase: priorityBase as Task['priorityBase'], priorityAgingStartedAt: validIso(text(row, 'priority_aging_started_at'), createdAt), description: text(row, 'description') ?? '', dueDate: text(row, 'due_date'), completedAt: toDateOrNull(text(row, 'completed_at')), createdAt, updatedAt, deletedAt: toDateOrNull(text(row, 'deleted_at')) }
}
function noteFrom(row: Row): Note | null {
  const now = new Date().toISOString(); const id = text(row, 'id'); const title = text(row, 'title'); const content = text(row, 'content'); if (!id || title === null || content === null) return null
  const createdAt = validIso(text(row, 'created_at'), now); return { id, title, content, createdAt, updatedAt: validIso(text(row, 'updated_at'), createdAt), deletedAt: toDateOrNull(text(row, 'deleted_at')) }
}
function birthdayFrom(row: Row): Birthday | null {
  const now = new Date().toISOString(); const id = text(row, 'id'); const name = text(row, 'name'); const month = number(row, 'month'); const day = number(row, 'day'); if (!id || name === null || month === null || day === null || month < 1 || month > 12 || day < 1 || day > 31) return null
  const createdAt = validIso(text(row, 'created_at'), now); return { id, name, month, day, createdAt, updatedAt: validIso(text(row, 'updated_at'), createdAt), deletedAt: toDateOrNull(text(row, 'deleted_at')) }
}
function linkFrom(row: Row): TaskNoteLink | null {
  const now = new Date().toISOString(); const id = text(row, 'id'); const taskId = text(row, 'task_id'); const noteId = text(row, 'note_id'); if (!id || !taskId || !noteId) return null
  const createdAt = validIso(text(row, 'created_at'), now); return { id, taskId, noteId, createdAt, updatedAt: validIso(text(row, 'updated_at'), createdAt), deletedAt: toDateOrNull(text(row, 'deleted_at')) }
}
function settingsFrom(row: Row): Settings | null {
  const updatedAt = text(row, 'updated_at') ?? new Date().toISOString(); const language = text(row, 'language'); const theme = text(row, 'theme'); const accentColor = text(row, 'accent_color'); const priorityAgingEnabled = boolean(row, 'priority_aging_enabled'); const priorityAgingIntervalDays = number(row, 'priority_aging_interval_days')
  if (!['en', 'es'].includes(language ?? '') || !['system', 'light', 'dark'].includes(theme ?? '') || !['blue', 'purple', 'pink', 'green', 'orange', 'teal'].includes(accentColor ?? '') || priorityAgingEnabled === null || priorityAgingIntervalDays === null) return null
  return { id: 'app', language: language as Settings['language'], theme: theme as Settings['theme'], accentColor: accentColor as Settings['accentColor'], priorityAgingEnabled, priorityAgingIntervalDays, showHabitsOnDashboard: true, updatedAt }
}

function taskRow(userId: string, task: Task) { return { user_id: userId, id: task.id, title: task.title, status: task.status, bucket: task.bucket, priority_base: task.priorityBase, priority_aging_started_at: task.priorityAgingStartedAt, description: task.description, due_date: task.dueDate, completed_at: task.completedAt, created_at: task.createdAt, updated_at: task.updatedAt, deleted_at: task.deletedAt } }
function noteRow(userId: string, note: Note) { return { user_id: userId, id: note.id, title: note.title, content: note.content, created_at: note.createdAt, updated_at: note.updatedAt, deleted_at: note.deletedAt } }
function birthdayRow(userId: string, birthday: Birthday) { return { user_id: userId, id: birthday.id, name: birthday.name, month: birthday.month, day: birthday.day, created_at: birthday.createdAt, updated_at: birthday.updatedAt, deleted_at: birthday.deletedAt } }
function linkRow(userId: string, link: TaskNoteLink) { return { user_id: userId, id: link.id, task_id: link.taskId, note_id: link.noteId, created_at: link.createdAt, updated_at: link.updatedAt, deleted_at: link.deletedAt } }
function settingsRow(userId: string, settings: Settings) { return { user_id: userId, id: settings.id, language: settings.language, theme: settings.theme, accent_color: settings.accentColor, priority_aging_enabled: settings.priorityAgingEnabled, priority_aging_interval_days: settings.priorityAgingIntervalDays, updated_at: settings.updatedAt } }

export class SupabaseSyncProvider implements SyncProvider {
  constructor(private readonly userId: string) {}

  async pushChanges(changes: SyncChanges): Promise<PushResult> {
    const client = requireClient(); const rows: Row[] = []
    const push = async (table: string, values: Row[], onConflict = 'user_id,id') => { if (!values.length) return; const { data, error } = await client.from(table).upsert(values, { onConflict }).select('server_updated_at'); if (error) throw error; rows.push(...(data ?? []) as Row[]) }
    await push('tasks', changes.tasks.map((record) => taskRow(this.userId, record)))
    await push('notes', changes.notes.map((record) => noteRow(this.userId, record)))
    await push('birthdays', changes.birthdays.map((record) => birthdayRow(this.userId, record)))
    await push('task_note_links', changes.taskNoteLinks.map((record) => linkRow(this.userId, record)))
    await push('user_settings', changes.settings.map((record) => settingsRow(this.userId, record)), 'user_id')
    return { nextCursor: maxCursor(rows, null) }
  }

  async pullChanges(cursor: string | null): Promise<PullChanges> {
    const client = requireClient(); const allRows: Row[] = []
    const read = async (table: string) => { let query = client.from(table).select('*').order('server_updated_at', { ascending: true }); if (cursor) query = query.gt('server_updated_at', cursor); const { data, error } = await query; if (error) throw error; const rows = (data ?? []) as Row[]; allRows.push(...rows); return rows }
    const [tasks, notes, birthdays, taskNoteLinks, settings] = await Promise.all([read('tasks'), read('notes'), read('birthdays'), read('task_note_links'), read('user_settings')])
    return { tasks: tasks.map(taskFrom).filter((value): value is Task => Boolean(value)), notes: notes.map(noteFrom).filter((value): value is Note => Boolean(value)), birthdays: birthdays.map(birthdayFrom).filter((value): value is Birthday => Boolean(value)), taskNoteLinks: taskNoteLinks.map(linkFrom).filter((value): value is TaskNoteLink => Boolean(value)), settings: settings.map(settingsFrom).filter((value): value is Settings => Boolean(value)), nextCursor: maxCursor(allRows, cursor) }
  }
}
