import { supabase } from '../lib/supabaseClient.js'

/** All users with an `is_admin` flag. Admin-only in practice (RLS gates roles). */
export async function listUsers() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  const { data: roles } = await supabase.from('user_roles').select('user_id, role')
  const adminIds = new Set((roles || []).filter((r) => r.role === 'admin').map((r) => r.user_id))

  return profiles.map((p) => ({ ...p, is_admin: adminIds.has(p.id) }))
}

export async function grantAdmin(userId) {
  const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' })
  if (error && error.code !== '23505') throw error
}

export async function revokeAdmin(userId) {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'admin')
  if (error) throw error
}
