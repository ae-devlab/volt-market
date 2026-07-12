import { el } from '../utils/dom.js'
import { formatPrice, formatRange, formatBattery, CONDITION_LABELS, STATUS_LABELS } from '../utils/format.js'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#adb5bd" text-anchor="middle" dominant-baseline="middle">⚡ Няма снимка</text></svg>`,
  )

/**
 * Build a Bootstrap column with a listing card.
 * options: { favorite, onFavorite(listing, nextState), showStatus }
 */
export function listingCard(listing, { favorite = false, onFavorite = null, showStatus = false } = {}) {
  const col = el('div', { class: 'col-12 col-sm-6 col-lg-4 col-xl-3' })

  const img = el('img', {
    src: listing.cover || PLACEHOLDER,
    class: 'card-img-top listing-card-img',
    alt: listing.title,
    loading: 'lazy',
  })

  const statusBadge =
    showStatus && STATUS_LABELS[listing.status]
      ? el('span', { class: `badge ${STATUS_LABELS[listing.status].cls} position-absolute top-0 start-0 m-2` },
          el('i', { class: `bi ${STATUS_LABELS[listing.status].icon} me-1` }),
          STATUS_LABELS[listing.status].text)
      : null

  let favBtn = null
  if (onFavorite) {
    let state = favorite
    favBtn = el('button', {
      type: 'button',
      class: 'btn btn-light btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm',
      title: 'Запази',
      onClick: async (e) => {
        e.preventDefault()
        e.stopPropagation()
        const next = !state
        await onFavorite(listing, next)
        state = next
        heart.className = `bi ${state ? 'bi-heart-fill text-danger' : 'bi-heart'}`
      },
    })
    const heart = el('i', { class: `bi ${favorite ? 'bi-heart-fill text-danger' : 'bi-heart'}` })
    favBtn.append(heart)
  }

  const specs = el('div', { class: 'd-flex flex-wrap gap-2 mb-2' },
    el('span', { class: 'badge text-bg-light border' }, el('i', { class: 'bi bi-battery-charging me-1' }), formatBattery(listing.battery_capacity_kwh)),
    el('span', { class: 'badge text-bg-light border' }, el('i', { class: 'bi bi-ev-station me-1' }), formatRange(listing.range_km)),
    listing.year ? el('span', { class: 'badge text-bg-light border' }, el('i', { class: 'bi bi-calendar me-1' }), listing.year) : null,
  )

  const body = el('div', { class: 'card-body d-flex flex-column' },
    el('div', { class: 'small text-muted mb-1' },
      listing.categories?.name || 'Автомобил',
      listing.condition ? ` · ${CONDITION_LABELS[listing.condition] || ''}` : ''),
    el('h6', { class: 'card-title fw-semibold text-truncate mb-1' }, listing.title),
    el('div', { class: 'text-muted small mb-2' }, [listing.brand, listing.model].filter(Boolean).join(' ') || ' '),
    specs,
    el('div', { class: 'mt-auto pt-2' },
      el('div', { class: 'fw-bold fs-5 text-primary lh-1' }, formatPrice(listing.price)),
      el('div', { class: 'small text-muted mt-1' }, el('i', { class: 'bi bi-geo-alt me-1' }), listing.location || '—')),
  )

  const imgWrap = el('div', { class: 'position-relative' }, img, statusBadge, favBtn)
  const card = el('a', { href: `/listing.html?id=${listing.id}`, class: 'card h-100 text-decoration-none text-body listing-card shadow-sm' },
    imgWrap, body)

  col.append(card)
  return col
}
