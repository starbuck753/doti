import { db } from '../data/db'
import type { SyncState } from './types'

const makeDeviceId = () => {
  const key = 'doti-device-id'
  const existing = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  if (existing) return existing
  const value = crypto.randomUUID()
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  return value
}

export async function getSyncState(): Promise<SyncState> {
  const existing = await db.syncState.get('current')
  if (existing) return existing
  const state: SyncState = { id: 'current', currentUserId: null, lastPullCursor: null, lastSuccessfulSyncAt: null, deviceId: makeDeviceId() }
  await db.syncState.put(state)
  return state
}

export async function updateSyncState(patch: Partial<Omit<SyncState, 'id'>>) {
  const next = { ...(await getSyncState()), ...patch, id: 'current' as const }
  await db.syncState.put(next)
  return next
}

export async function resetSyncMetadata() {
  await db.transaction('rw', db.syncMeta, db.syncState, async () => {
    await db.syncMeta.clear()
    const state = await getSyncState()
    await db.syncState.put({ ...state, lastPullCursor: null, lastSuccessfulSyncAt: null })
  })
}
