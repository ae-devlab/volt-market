// Shared helpers for the create/edit listing forms.
import { qs } from './dom.js'
import { listCategories } from '../services/categories.js'

export async function fillCategorySelect(selectEl, selectedId = '') {
  const cats = await listCategories()
  selectEl.innerHTML = ''
  for (const c of cats) {
    const opt = document.createElement('option')
    opt.value = c.id
    opt.textContent = c.name
    if (String(c.id) === String(selectedId)) opt.selected = true
    selectEl.append(opt)
  }
}

const num = (value) => (value === '' || value == null ? null : Number(value))

export function readListingForm() {
  return {
    title: qs('#title').value.trim(),
    category_id: num(qs('#category').value),
    condition: qs('#condition').value,
    brand: qs('#brand').value.trim() || null,
    model: qs('#model').value.trim() || null,
    year: num(qs('#year').value),
    price: num(qs('#price').value) ?? 0,
    mileage_km: num(qs('#mileage').value),
    battery_capacity_kwh: num(qs('#battery').value),
    range_km: num(qs('#range').value),
    location: qs('#location').value.trim() || null,
    description: qs('#description').value.trim() || null,
  }
}

export function fillListingForm(listing) {
  qs('#title').value = listing.title || ''
  qs('#condition').value = listing.condition || 'used'
  qs('#brand').value = listing.brand || ''
  qs('#model').value = listing.model || ''
  qs('#year').value = listing.year || ''
  qs('#price').value = listing.price ?? ''
  qs('#mileage').value = listing.mileage_km ?? ''
  qs('#battery').value = listing.battery_capacity_kwh ?? ''
  qs('#range').value = listing.range_km ?? ''
  qs('#location').value = listing.location || ''
  qs('#description').value = listing.description || ''
}
