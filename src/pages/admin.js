import '../lib/theme.js'
import { onReady, qs, el, escapeHtml } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { requireAdmin } from '../utils/guards.js'
import { listPending, listAll, setStatus, remove as removeListing } from '../services/listings.js'
import { listUsers, grantAdmin, revokeAdmin } from '../services/admin.js'
import { getUser } from '../services/auth.js'
import { showToast } from '../components/toast.js'
import { friendlyError } from '../utils/errors.js'
import { formatPrice, STATUS_LABELS } from '../utils/format.js'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e9ecef"/></svg>')

let currentUserId = null

// ---------- Pending moderation ----------
function pendingCard(listing) {
  const col = el('div', { class: 'col-12 col-md-6 col-lg-4' })
  const seller = listing.profiles || {}
  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <img src="${listing.cover || PLACEHOLDER}" class="card-img-top listing-card-img" alt="">
      <div class="card-body d-flex flex-column">
        <h6 class="fw-semibold mb-1">${escapeHtml(listing.title)}</h6>
        <div class="text-primary fw-bold mb-1">${formatPrice(listing.price)}</div>
        <div class="small text-muted mb-3"><i class="bi bi-person me-1"></i>${escapeHtml(seller.username || seller.full_name || '—')}</div>
        <div class="mt-auto d-flex gap-2">
          <a href="/listing.html?id=${listing.id}" class="btn btn-sm btn-outline-secondary"><i class="bi bi-eye"></i></a>
          <button class="btn btn-sm btn-success flex-fill" data-action="approve"><i class="bi bi-check-lg me-1"></i>Одобри</button>
          <button class="btn btn-sm btn-outline-danger flex-fill" data-action="reject"><i class="bi bi-x-lg me-1"></i>Отхвърли</button>
        </div>
      </div>
    </div>`

  const act = async (status) => {
    try {
      await setStatus(listing.id, status)
      showToast(status === 'approved' ? 'Обявата е одобрена.' : 'Обявата е отхвърлена.', 'success')
      loadPending()
    } catch (err) {
      showToast(friendlyError(err), 'danger')
    }
  }
  col.querySelector('[data-action="approve"]').addEventListener('click', () => act('approved'))
  col.querySelector('[data-action="reject"]').addEventListener('click', () => act('rejected'))
  return col
}

async function loadPending() {
  const list = qs('#pending-list')
  const empty = qs('#pending-empty')
  list.innerHTML = ''
  empty.classList.add('d-none')
  try {
    const items = await listPending()
    qs('#pending-count').textContent = items.length
    if (!items.length) empty.classList.remove('d-none')
    items.forEach((item) => list.append(pendingCard(item)))
  } catch (err) {
    showToast(friendlyError(err), 'danger')
  }
}

// ---------- All listings ----------
function statusSelect(listing) {
  const options = ['pending', 'approved', 'rejected', 'sold']
    .map((s) => `<option value="${s}" ${s === listing.status ? 'selected' : ''}>${STATUS_LABELS[s].text}</option>`)
    .join('')
  return `<select class="form-select form-select-sm" data-status style="min-width:150px">${options}</select>`
}

async function loadAll() {
  const tbody = qs('#all-rows')
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>'
  try {
    const items = await listAll()
    tbody.innerHTML = ''
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Няма обяви.</td></tr>'
      return
    }
    items.forEach((listing) => {
      const seller = listing.profiles || {}
      const tr = el('tr')
      tr.innerHTML = `
        <td><a href="/listing.html?id=${listing.id}" class="text-decoration-none fw-semibold">${escapeHtml(listing.title)}</a></td>
        <td class="small text-muted">${escapeHtml(seller.username || '—')}</td>
        <td>${formatPrice(listing.price)}</td>
        <td>${statusSelect(listing)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-action="delete"><i class="bi bi-trash"></i></button></td>`
      tr.querySelector('[data-status]').addEventListener('change', async (e) => {
        try {
          await setStatus(listing.id, e.target.value)
          showToast('Статусът е обновен.', 'success')
          qs('#pending-count') && loadPending()
        } catch (err) {
          showToast(friendlyError(err), 'danger')
        }
      })
      tr.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (!confirm('Да изтрия ли обявата?')) return
        try {
          await removeListing(listing.id)
          tr.remove()
          showToast('Обявата е изтрита.', 'success')
        } catch (err) {
          showToast(friendlyError(err), 'danger')
        }
      })
      tbody.append(tr)
    })
  } catch (err) {
    showToast(friendlyError(err), 'danger')
  }
}

// ---------- Users ----------
async function loadUsers() {
  const tbody = qs('#user-rows')
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>'
  try {
    const users = await listUsers()
    tbody.innerHTML = ''
    users.forEach((user) => {
      const isSelf = user.id === currentUserId
      const tr = el('tr')
      tr.innerHTML = `
        <td class="fw-semibold">${escapeHtml(user.username || '—')}</td>
        <td class="small text-muted">${escapeHtml(user.full_name || '')}</td>
        <td>${user.is_admin ? '<span class="badge text-bg-success">Админ</span>' : '<span class="badge text-bg-light border">Потребител</span>'}</td>
        <td class="text-end">
          ${user.is_admin
            ? `<button class="btn btn-sm btn-outline-danger" data-action="revoke" ${isSelf ? 'disabled title="Не можеш да премахнеш себе си"' : ''}>Премахни админ</button>`
            : '<button class="btn btn-sm btn-outline-success" data-action="grant">Направи админ</button>'}
        </td>`
      const grantBtn = tr.querySelector('[data-action="grant"]')
      const revokeBtn = tr.querySelector('[data-action="revoke"]')
      if (grantBtn) {
        grantBtn.addEventListener('click', async () => {
          try {
            await grantAdmin(user.id)
            showToast('Потребителят е вече админ.', 'success')
            loadUsers()
          } catch (err) {
            showToast(friendlyError(err), 'danger')
          }
        })
      }
      if (revokeBtn && !isSelf) {
        revokeBtn.addEventListener('click', async () => {
          try {
            await revokeAdmin(user.id)
            showToast('Админ правата са премахнати.', 'success')
            loadUsers()
          } catch (err) {
            showToast(friendlyError(err), 'danger')
          }
        })
      }
      tbody.append(tr)
    })
  } catch (err) {
    showToast(friendlyError(err), 'danger')
  }
}

onReady(async () => {
  renderNavbar('admin')
  renderFooter()
  const session = await requireAdmin()
  if (!session) return

  const user = await getUser()
  currentUserId = user?.id ?? null

  await loadPending()

  let allLoaded = false
  let usersLoaded = false
  qs('[data-bs-target="#pane-all"]').addEventListener('shown.bs.tab', () => {
    if (!allLoaded) {
      allLoaded = true
      loadAll()
    }
  })
  qs('[data-bs-target="#pane-users"]').addEventListener('shown.bs.tab', () => {
    if (!usersLoaded) {
      usersLoaded = true
      loadUsers()
    }
  })
})
