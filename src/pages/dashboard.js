import '../lib/theme.js'
import { onReady, qs, el, escapeHtml } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { requireAuth } from '../utils/guards.js'
import { listMine, remove as removeListing, markSold } from '../services/listings.js'
import { listMine as listFavorites, toggle } from '../services/favorites.js'
import { listingCard } from '../components/listingCard.js'
import { showToast } from '../components/toast.js'
import { friendlyError } from '../utils/errors.js'
import { formatPrice, STATUS_LABELS } from '../utils/format.js'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e9ecef"/></svg>')

function myListingCard(listing, onChange) {
  const status = STATUS_LABELS[listing.status]
  const col = el('div', { class: 'col-12 col-md-6 col-xl-4' })
  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <div class="position-relative">
        <img src="${listing.cover || PLACEHOLDER}" class="card-img-top listing-card-img" alt="">
        <span class="badge ${status.cls} position-absolute top-0 start-0 m-2"><i class="bi ${status.icon} me-1"></i>${status.text}</span>
      </div>
      <div class="card-body d-flex flex-column">
        <h6 class="fw-semibold text-truncate mb-1">${escapeHtml(listing.title)}</h6>
        <div class="text-primary fw-bold mb-3">${formatPrice(listing.price)}</div>
        <div class="mt-auto d-flex flex-wrap gap-1">
          <a href="/listing.html?id=${listing.id}" class="btn btn-sm btn-outline-secondary" title="Виж"><i class="bi bi-eye"></i></a>
          <a href="/edit.html?id=${listing.id}" class="btn btn-sm btn-outline-primary" title="Редактирай"><i class="bi bi-pencil"></i></a>
          ${listing.status === 'approved' ? '<button class="btn btn-sm btn-outline-dark" data-action="sold" title="Маркирай продадена"><i class="bi bi-bag-check"></i></button>' : ''}
          <button class="btn btn-sm btn-outline-danger" data-action="delete" title="Изтрий"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>`

  const soldBtn = col.querySelector('[data-action="sold"]')
  if (soldBtn) {
    soldBtn.addEventListener('click', async () => {
      try {
        await markSold(listing.id)
        showToast('Маркирана като продадена.', 'success')
        onChange()
      } catch (err) {
        showToast(friendlyError(err), 'danger')
      }
    })
  }
  col.querySelector('[data-action="delete"]').addEventListener('click', async () => {
    if (!confirm('Да изтрия ли тази обява?')) return
    try {
      await removeListing(listing.id)
      showToast('Обявата е изтрита.', 'success')
      onChange()
    } catch (err) {
      showToast(friendlyError(err), 'danger')
    }
  })
  return col
}

async function loadMyListings() {
  const loading = qs('#listings-loading')
  const grid = qs('#my-listings')
  const empty = qs('#listings-empty')
  loading.classList.remove('d-none')
  grid.innerHTML = ''
  empty.classList.add('d-none')
  try {
    const items = await listMine()
    if (!items.length) empty.classList.remove('d-none')
    items.forEach((item) => grid.append(myListingCard(item, loadMyListings)))
  } catch (err) {
    showToast(friendlyError(err), 'danger')
  } finally {
    loading.classList.add('d-none')
  }
}

async function loadFavorites() {
  const loading = qs('#favorites-loading')
  const grid = qs('#my-favorites')
  const empty = qs('#favorites-empty')
  loading.classList.remove('d-none')
  grid.innerHTML = ''
  empty.classList.add('d-none')
  try {
    const items = await listFavorites()
    if (!items.length) empty.classList.remove('d-none')
    items.forEach((item) =>
      grid.append(
        listingCard(item, {
          favorite: true,
          onFavorite: async (listing, next) => {
            try {
              await toggle(listing.id, !next)
              if (!next) loadFavorites()
            } catch (err) {
              showToast(friendlyError(err), 'danger')
            }
          },
        }),
      ),
    )
  } catch (err) {
    showToast(friendlyError(err), 'danger')
  } finally {
    loading.classList.add('d-none')
  }
}

onReady(async () => {
  renderNavbar('dashboard')
  renderFooter()
  const session = await requireAuth()
  if (!session) return

  await loadMyListings()

  let favLoaded = false
  qs('#tab-favorites').addEventListener('shown.bs.tab', () => {
    if (!favLoaded) {
      favLoaded = true
      loadFavorites()
    }
  })
})
