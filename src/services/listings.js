import { supabase } from '../lib/supabaseClient.js'
import { getPublicUrl, uploadListingImages, removeListingImageFile, removeListingImageFiles } from './storage.js'

const LIST_SELECT = `
  id, title, brand, model, year, price, mileage_km, battery_capacity_kwh, range_km,
  condition, location, description, status, created_at, updated_at, category_id, seller_id,
  categories ( id, name, slug, icon ),
  listing_images ( id, storage_path, is_primary, sort_order ),
  profiles ( id, username, full_name, avatar_url, phone, location )
`

/** Attach resolved public image URLs + a cover image. */
function decorate(listing) {
  if (!listing) return listing
  const images = (listing.listing_images || [])
    .slice()
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((img) => ({ ...img, url: getPublicUrl('listing-images', img.storage_path) }))
  return { ...listing, images, cover: images[0]?.url ?? null }
}

/** Public browse — only approved listings, with optional filters/sort. */
export async function listApproved(filters = {}) {
  const { search, categoryId, minPrice, maxPrice, minRange, condition, sort } = filters
  let query = supabase.from('listings').select(LIST_SELECT).eq('status', 'approved')

  if (categoryId) query = query.eq('category_id', categoryId)
  if (condition) query = query.eq('condition', condition)
  if (minPrice) query = query.gte('price', minPrice)
  if (maxPrice) query = query.lte('price', maxPrice)
  if (minRange) query = query.gte('range_km', minRange)
  if (search) {
    const s = String(search).replace(/[,%()]/g, ' ').trim()
    if (s) query = query.or(`title.ilike.%${s}%,brand.ilike.%${s}%,model.ilike.%${s}%`)
  }

  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else if (sort === 'range_desc') query = query.order('range_km', { ascending: false, nullsFirst: false })
  else query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data.map(decorate)
}

export async function getById(id) {
  const { data, error } = await supabase.from('listings').select(LIST_SELECT).eq('id', id).single()
  if (error) throw error
  return decorate(data)
}

export async function listByIds(ids) {
  if (!ids || !ids.length) return []
  const { data, error } = await supabase.from('listings').select(LIST_SELECT).in('id', ids)
  if (error) throw error
  return data.map(decorate)
}

export async function listBySeller(sellerId) {
  const { data, error } = await supabase
    .from('listings')
    .select(LIST_SELECT)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(decorate)
}

export async function listMine() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  return listBySeller(user.id)
}

/** Create a listing and upload its images. */
export async function create(payload, imageFiles = []) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Трябва да си влязъл, за да публикуваш обява.')

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({ ...payload, seller_id: user.id })
    .select()
    .single()
  if (error) throw error

  if (imageFiles.length) {
    let rows = []
    try {
      rows = await uploadListingImages(imageFiles, listing.id, user.id, { firstIsPrimary: true })
      const { error: imgError } = await supabase.from('listing_images').insert(rows)
      if (imgError) throw imgError
    } catch (uploadErr) {
      // roll back so a failed upload never leaves a phantom listing or orphaned files
      try { await supabase.from('listings').delete().eq('id', listing.id) } catch { /* best effort */ }
      if (rows.length) {
        try { await removeListingImageFiles(rows.map((r) => r.storage_path)) } catch { /* best effort */ }
      }
      throw uploadErr
    }
  }
  return listing
}

export async function update(id, patch) {
  const { data, error } = await supabase.from('listings').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function addImages(id, imageFiles) {
  if (!imageFiles?.length) return []
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Трябва да си влязъл.')
  // Use the LIVE image count as the single source of truth (avoids a stale caller flag):
  // the newly added image becomes primary only when the listing currently has none.
  const { count } = await supabase
    .from('listing_images')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', id)
  const existing = count || 0
  const rows = await uploadListingImages(imageFiles, id, user.id, {
    startOrder: existing,
    firstIsPrimary: existing === 0,
  })
  const { data, error } = await supabase.from('listing_images').insert(rows).select()
  if (error) throw error
  return data
}

export async function removeImage(image) {
  const { error } = await supabase.from('listing_images').delete().eq('id', image.id)
  if (error) throw error
  try {
    await removeListingImageFile(image.storage_path)
  } catch {
    /* row is gone; orphaned file is harmless */
  }
}

export async function remove(id) {
  // fetch the image paths first so we can free the storage objects after the row is gone
  const { data: imgs } = await supabase.from('listing_images').select('storage_path').eq('listing_id', id)
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) throw error
  const paths = (imgs || []).map((i) => i.storage_path)
  if (paths.length) {
    try { await removeListingImageFiles(paths) } catch { /* best effort — row already deleted */ }
  }
}

// --- Admin / moderation (page is guarded; RLS lets admins see & change all) ---

export async function listByStatus(status) {
  const { data, error } = await supabase
    .from('listings')
    .select(LIST_SELECT)
    .eq('status', status)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(decorate)
}

export async function listAll() {
  const { data, error } = await supabase
    .from('listings')
    .select(LIST_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(decorate)
}

export const listPending = () => listByStatus('pending')
export const setStatus = (id, status) => update(id, { status })
export const markSold = (id) => update(id, { status: 'sold' })
