import type { Birthday, Note, Settings, Task, TaskNoteLink } from '../domain/models'

export type SyncEntityType = 'tasks' | 'notes' | 'birthdays' | 'taskNoteLinks' | 'settings'
export type SyncRecord = Task | Note | Birthday | TaskNoteLink | Settings

export interface SyncChanges {
  tasks: Task[]
  notes: Note[]
  birthdays: Birthday[]
  taskNoteLinks: TaskNoteLink[]
  settings: Settings[]
}

export interface PullChanges extends SyncChanges {
  nextCursor: string | null
}

export interface PushResult {
  nextCursor: string | null
}

export interface SyncProvider {
  pushChanges(changes: SyncChanges): Promise<PushResult>
  pullChanges(cursor: string | null): Promise<PullChanges>
}

export interface AuthUser {
  id: string
  email: string | null
}

export interface AuthProvider {
  isConfigured: boolean
  getCurrentUser(): Promise<AuthUser | null>
  signIn(email: string, password: string): Promise<{ user: AuthUser | null; needsEmailConfirmation: boolean }>
  signUp(email: string, password: string): Promise<{ user: AuthUser | null; needsEmailConfirmation: boolean }>
  signOut(): Promise<void>
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void
}

export interface SyncState {
  id: 'current'
  currentUserId: string | null
  lastPullCursor: string | null
  lastSuccessfulSyncAt: string | null
  deviceId: string
}

export interface SyncMeta {
  entityType: SyncEntityType
  entityId: string
  lastSyncedLocalUpdatedAt: string
}

export type SyncStatus = 'not-connected' | 'syncing' | 'synced' | 'offline' | 'error'
