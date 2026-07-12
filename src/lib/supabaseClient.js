import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(url && anonKey)

if (!hasSupabaseConfig) {
  console.error(
    '[VoltMarket] Липсват Supabase env променливи. ' +
      'Копирай .env.example към .env и попълни VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.',
  )
}

// Fallbacks keep createClient from throwing so the UI still renders before .env is set.
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'anon-placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
