import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getSyncState, updateSyncState } from './localSyncState'
import { LOCAL_CHANGE_EVENT } from './signals'
import { supabaseAuthProvider } from './supabaseAuthProvider'
import { SupabaseSyncProvider } from './supabaseSyncProvider'
import { SyncEngine } from './syncEngine'
import type { AuthUser, SyncStatus } from './types'

export class DifferentAccountError extends Error {}

interface SyncContextValue {
  isConfigured: boolean
  user: AuthUser | null
  status: SyncStatus
  lastSyncedAt: string | null
  error: Error | null
  signIn: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

export function SyncProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<SyncStatus>('not-connected')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const engineRef = useRef<SyncEngine | null>(null)

  const activateUser = useCallback(async (nextUser: AuthUser | null) => {
    if (!nextUser) { setUser(null); engineRef.current = null; setStatus('not-connected'); return }
    const state = await getSyncState()
    if (state.currentUserId && state.currentUserId !== nextUser.id) {
      await supabaseAuthProvider.signOut().catch(() => undefined)
      const mismatch = new DifferentAccountError('A different account is already associated with this local Doti data.')
      setError(mismatch); setStatus('error'); setUser(null); engineRef.current = null
      throw mismatch
    }
    await updateSyncState({ currentUserId: nextUser.id })
    setError(null); setUser(nextUser); setLastSyncedAt(state.lastSuccessfulSyncAt)
    engineRef.current = new SyncEngine(new SupabaseSyncProvider(nextUser.id), (nextStatus) => { setStatus(nextStatus); if (nextStatus === 'synced') void getSyncState().then((latest) => setLastSyncedAt(latest.lastSuccessfulSyncAt)) })
  }, [])

  useEffect(() => {
    let active = true
    void supabaseAuthProvider.getCurrentUser().then((nextUser) => { if (active && nextUser) void activateUser(nextUser).catch(() => undefined) })
    const unsubscribe = supabaseAuthProvider.onAuthStateChange((nextUser) => { if (active) void activateUser(nextUser).catch(() => undefined) })
    return () => { active = false; unsubscribe() }
  }, [activateUser])

  const syncNow = useCallback(async () => { if (!engineRef.current) return; setError(null); try { await engineRef.current.sync() } catch (cause) { setError(cause instanceof Error ? cause : new Error('Sync failed')) } }, [])
  const signIn = useCallback(async (email: string, password: string) => { setError(null); const result = await supabaseAuthProvider.signIn(email, password); if (result.user) await activateUser(result.user); return { needsEmailConfirmation: result.needsEmailConfirmation } }, [activateUser])
  const signUp = useCallback(async (email: string, password: string) => { setError(null); const result = await supabaseAuthProvider.signUp(email, password); if (result.user && !result.needsEmailConfirmation) await activateUser(result.user); return { needsEmailConfirmation: result.needsEmailConfirmation } }, [activateUser])
  const signOut = useCallback(async () => { await supabaseAuthProvider.signOut(); setUser(null); engineRef.current = null; setStatus('not-connected'); setError(null) }, [])

  useEffect(() => {
    if (!user) return
    let timer: number | undefined
    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(() => void syncNow(), 800) }
    const onOnline = () => { setStatus('syncing'); void syncNow() }
    const onVisible = () => { if (document.visibilityState === 'visible') void syncNow() }
    window.addEventListener(LOCAL_CHANGE_EVENT, schedule)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    void syncNow()
    return () => { window.clearTimeout(timer); window.removeEventListener(LOCAL_CHANGE_EVENT, schedule); window.removeEventListener('online', onOnline); document.removeEventListener('visibilitychange', onVisible) }
  }, [user, syncNow])

  const value = useMemo(() => ({ isConfigured: supabaseAuthProvider.isConfigured, user, status, lastSyncedAt, error, signIn, signUp, signOut, syncNow }), [user, status, lastSyncedAt, error, signIn, signUp, signOut, syncNow])
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) throw new Error('useSync must be used inside SyncProvider')
  return context
}
