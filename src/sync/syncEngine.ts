import { db } from '../data/db'
import type { Birthday, Note, Settings, Task, TaskNoteLink } from '../domain/models'
import { getSyncState, updateSyncState } from './localSyncState'
import type { SyncChanges, SyncEntityType, SyncProvider, SyncRecord, SyncStatus } from './types'

const entityTypes: SyncEntityType[] = ['tasks', 'notes', 'birthdays', 'taskNoteLinks', 'settings']
const recordUpdatedAt = (record: SyncRecord) => record.updatedAt
const tableFor = (entityType: SyncEntityType) => db[entityType] as any
const emptyChanges = (): SyncChanges => ({ tasks: [], notes: [], birthdays: [], taskNoteLinks: [], settings: [] })

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
      const records = await tableFor(entityType).toArray() as SyncRecord[]
      ;(changes[entityType] as SyncRecord[]).push(...records.filter((record) => metadata.get(`${entityType}:${record.id}`) !== recordUpdatedAt(record)))
    }
    return changes
  }

  private async applyRemote(pulled: Awaited<ReturnType<SyncProvider['pullChanges']>>) {
    await db.transaction('rw', [db.tasks, db.notes, db.birthdays, db.taskNoteLinks, db.settings, db.syncMeta], async () => {
      for (const entityType of entityTypes) {
        for (const remote of pulled[entityType] as SyncRecord[]) {
          const table = tableFor(entityType)
          const local = await table.get(remote.id) as SyncRecord | undefined
          if (!local || isNewer(remote, local)) {
            // Dashboard visibility is a local presentation preference, not shared sync data.
            const value = entityType === 'settings'
              ? { ...remote, showHabitsOnDashboard: (local as Settings | undefined)?.showHabitsOnDashboard ?? true }
              : remote
            await table.put(value)
            await db.syncMeta.put({ entityType, entityId: remote.id, lastSyncedLocalUpdatedAt: remote.updatedAt })
          }
        }
      }
    })
  }

  private async markPushed(changes: SyncChanges) {
    await db.transaction('rw', db.syncMeta, async () => {
      for (const entityType of entityTypes) {
        for (const record of changes[entityType] as SyncRecord[]) await db.syncMeta.put({ entityType, entityId: record.id, lastSyncedLocalUpdatedAt: record.updatedAt })
      }
    })
  }
}
