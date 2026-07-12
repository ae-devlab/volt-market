import '../lib/theme.js'
import { onReady, qs, getParam } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { listingCard } from '../components/listingCard.js'
import { showToast } from '../components/toast.js'
import { listApproved } from '../services/listings.js'
import { listCategories } from '../services/categories.js'
import { getSession } from '../services/auth.js'
import { myFavoriteIds, toggle } from '../services/favorites.js'
import { friendlyError } from '../utils/errors.js'

let favIds = new Set()
let loggedIn = false

async function loadCategories() {
  try {
    const cats = await listCategories()
    const select = qs('#f-category')
    for (const c of cats) {
      const opt = document.createElement('option')
      opt.value = c.id
      opt.textContent = c.name
      select.append(opt)
    }
  } catch {
    /* categories are optional for browsing */
  }
}

function currentFilters() {
  return {
    search: qs('#search-input').value.trim(),
    categoryId: qs('#f-category').value || null,
    condition: qs('#f-condition').value || null,
    minPrice: qs('#f-min-price').value || null,
    maxPrice: qs('#f-max-price').value || null,
    minRange: qs('#f-min-range').value || null,
    sort: qs('#f-sort').value,
  }
}

async function onFavorite(listing, next) {
  try {
    await toggle(listing.id, !next)
    if (next) favIds.add(listing.id)
    else favIds.delete(listing.id)
  } catch (err) {
    showToast(friendlyError(err), 'danger')
  }
}

async function loadResults() {
  const loading = qs('#loading')
  const results = qs('#results')
  const empty = qs('#empty')
  loading.classList.remove('d-none')
  results.innerHTML = ''
  empty.classList.add('d-none')
  try {
    const items = await listApproved(currentFilters())
    qs('#results-count').textContent = `${items.length} ${items.length === 1 ? 'обява' : 'обяви'}`
    const stat = qs('#stat-count')
    if (stat) stat.textContent = items.length
    if (!items.length) {
      empty.classList.remove('d-none')
      return
    }
    for (const item of items) {
      results.append(
        listingCard(item, {
          favorite: favIds.has(item.id),
          onFavorite: loggedIn ? onFavorite : null,
        }),
      )
    }
  } catch (err) {
    showToast('Грешка при зареждане: ' + friendlyError(err), 'danger')
  } finally {
    loading.classList.add('d-none')
  }
}

onReady(async () => {
  renderNavbar('home')
  renderFooter()

  const session = await getSession()
  loggedIn = Boolean(session)
  if (loggedIn) {
    try {
      favIds = new Set(await myFavoriteIds())
    } catch {
      /* ignore */
    }
  }

  await loadCategories()

  const preCat = getParam('category')
  if (preCat) qs('#f-category').value = preCat
  const preQuery = getParam('q')
  if (preQuery) qs('#search-input').value = preQuery

  await loadResults()

  qs('#search-form').addEventListener('submit', (e) => {
    e.preventDefault()
    loadResults()
  })
  qs('#filters').addEventListener('submit', (e) => {
    e.preventDefault()
    loadResults()
  })
  qs('#clear-filters').addEventListener('click', () => {
    qs('#filters').reset()
    qs('#search-input').value = ''
    loadResults()
  })
})
