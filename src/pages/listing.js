import '../lib/theme.js'
import { onReady, qs, qsa, getParam, escapeHtml } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { getById, remove as removeListing, markSold } from '../services/listings.js'
import { getSession, getUser, isAdmin } from '../services/auth.js'
import { myFavoriteIds, toggle } from '../services/favorites.js'
import { showToast } from '../components/toast.js'
import { friendlyError } from '../utils/errors.js'
import {
  formatPrice, formatMileage, formatRange, formatBattery, formatYear,
  CONDITION_LABELS, STATUS_LABELS,
} from '../utils/format.js'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" font-family="sans-serif" font-size="28" fill="#adb5bd" text-anchor="middle" dominant-baseline="middle">⚡ Няма снимка</text></svg>`,
  )

const spec = (icon, label, value) =>
  `<div class="spec-item"><i class="bi ${icon}"></i><span class="text-muted">${label}</span><span class="ms-auto fw-semibold">${escapeHtml(value)}</span></div>`

function render(listing, { canManage, isFav, loggedIn }) {
  const images = listing.images.length ? listing.images : [{ url: PLACEHOLDER }]
  const status = STATUS_LABELS[listing.status]
  const showStatus = listing.status !== 'approved'
  const seller = listing.profiles || {}

  const thumbs = images
    .map((img, i) => `<img src="${escapeHtml(img.url)}" class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" alt="">`)
    .join('')

  qs('#listing').innerHTML = `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb small">
        <li class="breadcrumb-item"><a href="/index.html">Обяви</a></li>
        <li class="breadcrumb-item active">${escapeHtml(listing.title)}</li>
      </ol>
    </nav>
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="mb-3">
          <img id="gallery-main" src="${escapeHtml(images[0].url)}" class="gallery-main shadow-sm" alt="${escapeHtml(listing.title)}">
          <div class="d-flex flex-wrap gap-2 mt-2" id="gallery-thumbs">${images.length > 1 ? thumbs : ''}</div>
        </div>

        <h3 class="fw-bold">${escapeHtml(listing.title)}
          ${showStatus ? `<span class="badge ${status.cls} align-middle fs-6"><i class="bi ${status.icon} me-1"></i>${status.text}</span>` : ''}
        </h3>
        <div class="text-muted mb-3">
          <i class="bi bi-tag me-1"></i>${escapeHtml(listing.categories?.name || 'Автомобил')}
          · ${escapeHtml(CONDITION_LABELS[listing.condition] || '')}
          · <i class="bi bi-geo-alt me-1"></i>${escapeHtml(listing.location || '—')}
        </div>

        <div class="card card-body shadow-sm mb-3">
          <h6 class="fw-bold mb-3"><i class="bi bi-list-check me-1"></i>Спецификации</h6>
          <div class="row">
            <div class="col-md-6">
              ${spec('bi-tag', 'Марка', listing.brand || '—')}
              ${spec('bi-car-front', 'Модел', listing.model || '—')}
              ${spec('bi-calendar', 'Година', formatYear(listing.year))}
            </div>
            <div class="col-md-6">
              ${spec('bi-battery-charging', 'Батерия', formatBattery(listing.battery_capacity_kwh))}
              ${spec('bi-ev-station', 'Обхват', formatRange(listing.range_km))}
              ${spec('bi-speedometer2', 'Пробег', formatMileage(listing.mileage_km))}
            </div>
          </div>
        </div>

        <div class="card card-body shadow-sm">
          <h6 class="fw-bold mb-2"><i class="bi bi-card-text me-1"></i>Описание</h6>
          <p class="mb-0" style="white-space: pre-line">${escapeHtml(listing.description || 'Няма описание.')}</p>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card shadow-sm sticky-lg-top" style="top: 84px">
          <div class="card-body">
            <div class="display-6 fw-bold text-primary mb-3">${formatPrice(listing.price)}</div>

            ${loggedIn ? `
              <button id="fav-btn" class="btn btn-outline-primary w-100 mb-3">
                <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'} me-1"></i>
                <span>${isFav ? 'Запазена' : 'Запази'}</span>
              </button>` : ''}

            <hr>
            <h6 class="fw-bold"><i class="bi bi-person me-1"></i>Продавач</h6>
            <div class="d-flex align-items-center gap-2 mb-2">
              ${seller.avatar_url
                ? `<img src="${escapeHtml(seller.avatar_url)}" class="rounded-circle" style="width:40px;height:40px;object-fit:cover" alt="">`
                : '<i class="bi bi-person-circle fs-3 text-secondary"></i>'}
              <div>
                <div class="fw-semibold">${escapeHtml(seller.full_name || seller.username || 'Потребител')}</div>
                <div class="small text-muted">${escapeHtml(seller.location || '')}</div>
              </div>
            </div>
            ${seller.phone
              ? `<a href="tel:${escapeHtml(seller.phone)}" class="btn btn-primary w-100"><i class="bi bi-telephone me-1"></i>${escapeHtml(seller.phone)}</a>`
              : '<div class="text-muted small">Няма посочен телефон.</div>'}

            ${canManage ? `
              <hr>
              <div class="d-grid gap-2">
                <a href="/edit.html?id=${listing.id}" class="btn btn-outline-secondary btn-sm"><i class="bi bi-pencil me-1"></i>Редактирай</a>
                ${listing.status === 'approved' ? '<button id="sold-btn" class="btn btn-outline-dark btn-sm"><i class="bi bi-bag-check me-1"></i>Маркирай като продадена</button>' : ''}
                <button id="delete-btn" class="btn btn-outline-danger btn-sm"><i class="bi bi-trash me-1"></i>Изтрий обявата</button>
              </div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `

  wireGallery(images)
  wireActions(listing, isFav)
}

function wireGallery(images) {
  const main = qs('#gallery-main')
  qsa('#gallery-thumbs .gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const idx = Number(thumb.dataset.index)
      main.src = images[idx].url
      qsa('#gallery-thumbs .gallery-thumb').forEach((t) => t.classList.remove('active'))
      thumb.classList.add('active')
    })
  })
}

function wireActions(listing, isFav) {
  const favBtn = qs('#fav-btn')
  if (favBtn) {
    let state = isFav
    favBtn.addEventListener('click', async () => {
      const next = !state
      try {
        await toggle(listing.id, state)
        state = next
        favBtn.querySelector('i').className = `bi ${state ? 'bi-heart-fill' : 'bi-heart'} me-1`
        favBtn.querySelector('span').textContent = state ? 'Запазена' : 'Запази'
      } catch (err) {
        showToast(friendlyError(err), 'danger')
      }
    })
  }

  const soldBtn = qs('#sold-btn')
  if (soldBtn) {
    soldBtn.addEventListener('click', async () => {
      try {
        await markSold(listing.id)
        showToast('Обявата е маркирана като продадена.', 'success')
        setTimeout(() => location.reload(), 700)
      } catch (err) {
        showToast(friendlyError(err), 'danger')
      }
    })
  }

  const deleteBtn = qs('#delete-btn')
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Сигурен ли си, че искаш да изтриеш обявата?')) return
      try {
        await removeListing(listing.id)
        showToast('Обявата е изтрита.', 'success')
        setTimeout(() => (location.href = '/dashboard.html'), 700)
      } catch (err) {
        showToast(friendlyError(err), 'danger')
      }
    })
  }
}

onReady(async () => {
  renderNavbar()
  renderFooter()

  const id = getParam('id')
  const loading = qs('#loading')
  const notFound = qs('#not-found')
  const container = qs('#listing')

  if (!id) {
    loading.classList.add('d-none')
    notFound.classList.remove('d-none')
    return
  }

  try {
    const listing = await getById(id)
    const session = await getSession()
    const loggedIn = Boolean(session)

    let canManage = false
    let isFav = false
    if (loggedIn) {
      const user = await getUser()
      const admin = await isAdmin()
      canManage = listing.seller_id === user.id || admin
      try {
        isFav = (await myFavoriteIds()).includes(Number(id))
      } catch {
        /* ignore */
      }
    }

    loading.classList.add('d-none')
    container.classList.remove('d-none')
    render(listing, { canManage, isFav, loggedIn })
  } catch {
    loading.classList.add('d-none')
    notFound.classList.remove('d-none')
  }
})
