import { supabase } from '../lib/supabaseClient.js'

const LISTING_BUCKET = 'listing-images'
const AVATAR_BUCKET = 'avatars'

export function getPublicUrl(bucket, path) {
  if (!path) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

const extOf = (file) => {
  const match = /\.([a-z0-9]+)$/i.exec(file.name || '')
  return (match ? match[1] : 'jpg').toLowerCase()
}

const randomId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

/**
 * Upload one or more image files for a listing.
 * Returns rows ready to insert into `listing_images`.
 */
export async function uploadListingImages(files, listingId, userId, { startOrder = 0, firstIsPrimary = false } = {}) {
  const rows = []
  const uploaded = []
  let index = 0
  try {
    for (const file of files) {
      const path = `${userId}/${listingId}/${randomId()}.${extOf(file)}`
      const { error } = await supabase.storage
        .from(LISTING_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      uploaded.push(path)
      rows.push({
        listing_id: listingId,
        storage_path: path,
        is_primary: firstIsPrimary && index === 0,
        sort_order: startOrder + index,
      })
      index++
    }
    return rows
  } catch (err) {
    // if any file fails mid-batch, don't leave the earlier ones orphaned
    if (uploaded.length) {
      try { await supabase.storage.from(LISTING_BUCKET).remove(uploaded) } catch { /* best effort */ }
    }
    throw err
  }
}

export async function removeListingImageFile(path) {
  const { error } = await supabase.storage.from(LISTING_BUCKET).remove([path])
  if (error) throw error
}

export async function removeListingImageFiles(paths) {
  if (!paths?.length) return
  const { error } = await supabase.storage.from(LISTING_BUCKET).remove(paths)
  if (error) throw error
}

export async function uploadAvatar(file, userId) {
  // remove any previous avatar(s) first so old files don't accumulate as orphans
  try {
    const { data: existing } = await supabase.storage.from(AVATAR_BUCKET).list(userId)
    if (existing?.length) {
      await supabase.storage.from(AVATAR_BUCKET).remove(existing.map((f) => `${userId}/${f.name}`))
    }
  } catch { /* best effort */ }

  const path = `${userId}/avatar-${randomId()}.${extOf(file)}`
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) throw error
  return getPublicUrl(AVATAR_BUCKET, path)
}
