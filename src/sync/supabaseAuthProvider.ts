import type { AuthProvider, AuthUser } from './types'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const toUser = (user: { id: string; email?: string | null } | null): AuthUser | null => user ? { id: user.id, email: user.email ?? null } : null

export const supabaseAuthProvider: AuthProvider = {
  isConfigured: isSupabaseConfigured,
  async getCurrentUser() {
    if (!supabase) return null
    const { data } = await supabase.auth.getUser()
    return toUser(data.user)
  },
  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { user: toUser(data.user), needsEmailConfirmation: !data.session }
  },
  async signUp(email, password) {
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return { user: toUser(data.user), needsEmailConfirmation: !data.session }
  },
  async signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  onAuthStateChange(callback) {
    if (!supabase) return () => undefined
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(toUser(session?.user ?? null)))
    return () => data.subscription.unsubscribe()
  },
}
