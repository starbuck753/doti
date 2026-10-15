import { db } from '../data/db'
import type { Birthday, Habit, HabitCheck, Note, Settings, Task, TaskNoteLink } from '../domain/models'
import { getSyncState, updateSyncState } from './localSyncState'
import type { SyncChanges, SyncEntityType, SyncProvider, SyncRecord, SyncStatus } from './types'
import { notifyBirthdayNotificationDataChanged } from '../notifications/birthdayNotificationScheduler'

// Habits must be applied before dependent HabitChecks.
const entityTypes: SyncEntityType[] = ['tasks', 'notes', 'birthdays', 'taskNoteLinks', 'settings', 'habits', 'habitChecks']
const recordUpdatedAt = (record: SyncRecord) => record.updatedAt
const tableFor = (entityType: SyncEntityType) => db[entityType] as any
const emptyChanges = (): SyncChanges => ({ tasks: [], notes: [], birthdays: [], taskNoteLinks: [], settings: [], habits: [], habitChecks: [] })

function isNewer(remote: SyncRecord, local: SyncRecord) {
  return remote.updatedAt >= local.updatedAt
}

export class SyncEngine {
  private running = false

  constructor(private readonly provider: SyncProvider, private readonly onStatus?: (status: SyncStatus) => void) {}

  async sync() {
    if (this.running) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) { this.onStatus?.('offline'); return }
    this.running = true; this.onStatus?.('syncing')
    try {
      const state = await getSyncState()
      const pulled = await this.provider.pullChanges(state.lastPullCursor)
      await this.applyRemote(pulled)
      const changes = await this.collectLocalChanges()
      const pushed = await this.provider.pushChanges(changes)
      await this.markPushed(changes)
      await updateSyncState({ lastPullCursor: pushed.nextCursor ?? pulled.nextCursor ?? state.lastPullCursor, lastSuccessfulSyncAt: new Date().toISOString() })
      this.onStatus?.('synced')
    } catch (error) {
      console.error('[Doti sync]', error)
      this.onStatus?.(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error')
      throw error
    } finally { this.running = false }
  }

  private async collectLocalChanges(): Promise<SyncChanges> {
    const changes = emptyChanges(); const metadata = new Map((await db.syncMeta.toArray()).map((entry) => [`${entry.entityType}:${entry.entityId}`, entry.lastSyncedLocalUpdatedAt]))
    for (const entityType of entityTypes) {
      let records = await tableFor(entityType).toArray() as SyncRecord[]
      if (entityType === 'habitChecks') {
        // HabitChecks are logically unique by (habitId, date). Only the latest
        // local state for each logical pair should be pushed.
        const byPair = new Map<string, HabitCheck>()
        for (const record of records as HabitCheck[]) {
          const key = `${record.habitId}:${record.date}`
          const existing = byPair.get(key)
          if (!existing || record.updatedAt > existing.updatedAt || (record.updatedAt === existing.updatedAt && record.id > existing.id)) {
            byPair.set(key, record)
          }
        }
        records = Array.from(byPair.values())
      }
      ;(changes[entityType] as SyncRecord[]).push(...records.filter((record) => metadata.get(`${entityType}:${record.id}`) !== recordUpdatedAt(record)))
    }
    return changes
  }

  private async applyRemote(pulled: Awaited<ReturnType<SyncProvider['pullChanges']>>) {
    let birthdayChanged = false
    await db.transaction('rw', [db.tasks, db.notes, db.birthdays, db.taskNoteLinks, db.settings, db.habits, db.habitChecks, db.syncMeta], async () => {
      for (const entityType of entityTypes) {
        for (const remote of pulled[entityType] as SyncRecord[]) {
          const table = tableFor(entityType)
          if (entityType === 'habitChecks') {
            const check = remote as HabitCheck
            const existing = await db.habitChecks.where('[habitId+date]').equals([check.habitId, check.date]).toArray()
            const local = existing[0]
            if (existing.length > 1 || !local || isNewer(check, local)) {
              // Replace the entire logical pair with the remote record to keep the
              // local state duplicate-free and convergent with the server.
              await db.habitChecks.bulkDelete(existing.map((c) => c.id))
              await db.habitChecks.put(check)
              for (const c of existing) await db.syncMeta.delete(['habitChecks', c.id])
              await db.syncMeta.put({ entityType, entityId: check.id, lastSyncedLocalUpdatedAt: check.updatedAt })
            }
            continue
          }
          const local = await table.get(remote.id) as SyncRecord | undefined
          if (!local || isNewer(remote, local)) {
            await table.put(remote)
            await db.syncMeta.put({ entityType, entityId: remote.id, lastSyncedLocalUpdatedAt: remote.updatedAt })
            if (entityType === 'birthdays') birthdayChanged = true
            if (entityType === 'settings') birthdayChanged = true
          }
        }
      }
    })
    if (birthdayChanged) notifyBirthdayNotificationDataChanged()
  }

  private async markPushed(changes: SyncChanges) {
    await db.transaction('rw', db.syncMeta, db.habitChecks, async () => {
      for (const entityType of entityTypes) {
        for (const record of changes[entityType] as SyncRecord[]) {
          await db.syncMeta.put({ entityType, entityId: record.id, lastSyncedLocalUpdatedAt: record.updatedAt })
          if (entityType === 'habitChecks') {
            const check = record as HabitCheck
            const duplicates = await db.habitChecks.where('[habitId+date]').equals([check.habitId, check.date]).toArray()
            for (const duplicate of duplicates) {
              await db.syncMeta.put({ entityType, entityId: duplicate.id, lastSyncedLocalUpdatedAt: duplicate.updatedAt })
            }
          }
        }
      }
    })
  }
}
