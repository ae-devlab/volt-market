import { supabase } from '../lib/supabaseClient.js'
import { listByIds } from './listings.js'

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function myFavoriteIds() {
  const uid = await currentUserId()
  if (!uid) return []
  const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', uid)
  if (error) return []
  return data.map((row) => row.listing_id)
}

export async function add(listingId) {
  const uid = await currentUserId()
  if (!uid) throw new Error('Влез в профила си, за да запазваш обяви.')
  const { error } = await supabase.from('favorites').insert({ user_id: uid, listing_id: listingId })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

export async function remove(listingId) {
  const uid = await currentUserId()
  if (!uid) return
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', uid)
    .eq('listing_id', listingId)
  if (error) throw error
}

export async function toggle(listingId, isCurrentlyFavorite) {
  return isCurrentlyFavorite ? remove(listingId) : add(listingId)
}

export async function listMine() {
  const ids = await myFavoriteIds()
  return listByIds(ids)
}
