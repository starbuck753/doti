import { createClient } from '@supabase/supabase-js'

const env = (import.meta as any).env as Record<string, string | undefined> | undefined
const url = env?.VITE_SUPABASE_URL
const anonKey = env?.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null

export const isSupabaseConfigured = Boolean(supabase)
