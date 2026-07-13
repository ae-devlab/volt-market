import { qs } from '../utils/dom.js'
import { escapeHtml } from '../utils/dom.js'
import { getSession, getCurrentProfile, isAdmin, logout } from '../services/auth.js'
import { currentTheme, toggleTheme } from '../utils/theme-mode.js'

const link = (href, label, icon, active) =>
  `<li class="nav-item">
     <a class="nav-link ${active ? 'active fw-semibold' : ''}" href="${href}">
       <i class="bi ${icon} me-1"></i>${label}
     </a>
   </li>`

function buildHtml({ session, profile, admin, active }) {
  const guestLinks = `
    <li class="nav-item"><a class="nav-link" href="/login.html"><i class="bi bi-box-arrow-in-right me-1"></i>Вход</a></li>
    <li class="nav-item"><a class="btn btn-primary btn-sm ms-lg-2 mt-2 mt-lg-0" href="/register.html"><i class="bi bi-person-plus me-1"></i>Регистрация</a></li>`

  const name = escapeHtml(profile?.username || profile?.full_name || 'Профил')
  const avatar = profile?.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="" class="rounded-circle me-1" style="width:24px;height:24px;object-fit:cover">`
    : '<i class="bi bi-person-circle me-1"></i>'

  const userMenu = `
    ${link('/sell.html', 'Публикувай', 'bi-plus-circle', active === 'sell')}
    ${link('/dashboard.html', 'Табло', 'bi-grid', active === 'dashboard')}
    ${admin ? link('/admin.html', 'Админ', 'bi-shield-lock', active === 'admin') : ''}
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        ${avatar}${name}
      </a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><a class="dropdown-item" href="/profile.html"><i class="bi bi-person me-2"></i>Моят профил</a></li>
        <li><a class="dropdown-item" href="/dashboard.html"><i class="bi bi-grid me-2"></i>Моите обяви</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item text-danger" href="#" id="nav-logout"><i class="bi bi-box-arrow-right me-2"></i>Изход</a></li>
      </ul>
    </li>`

  return `
  <nav class="navbar navbar-expand-lg sticky-top shadow-sm">
    <div class="container">
      <a class="navbar-brand fw-bold" href="/index.html">
        <i class="bi bi-lightning-charge-fill text-warning"></i> Volt<span class="text-primary">Market</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent"
              aria-controls="navContent" aria-expanded="false" aria-label="Меню">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          ${link('/index.html', 'Обяви', 'bi-grid-3x3-gap', active === 'home')}
        </ul>
        <ul class="navbar-nav align-items-lg-center gap-2 gap-lg-1">
          <li class="nav-item d-flex align-items-center">
            <button type="button" id="theme-toggle" class="nav-icon-btn" title="Смени темата" aria-label="Смени светла/тъмна тема">
              <i class="bi" id="theme-icon"></i>
            </button>
          </li>
          ${session ? userMenu : guestLinks}
        </ul>
      </div>
    </div>
  </nav>`
}

export async function renderNavbar(active = '') {
  const mount = qs('#site-nav')
  if (!mount) return

  const session = await getSession()
  let profile = null
  let admin = false
  if (session) {
    try {
      profile = await getCurrentProfile()
    } catch {
      /* profile row may still be provisioning */
    }
    admin = await isAdmin()
  }

  mount.innerHTML = buildHtml({ session, profile, admin, active })

  const logoutBtn = qs('#nav-logout', mount)
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (event) => {
      event.preventDefault()
      await logout()
      location.href = '/index.html'
    })
  }

  const themeBtn = qs('#theme-toggle', mount)
  const syncThemeIcon = () => {
    const icon = qs('#theme-icon', mount)
    if (icon) icon.className = `bi ${currentTheme() === 'dark' ? 'bi-moon-stars' : 'bi-sun-fill'}`
  }
  syncThemeIcon()
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      toggleTheme()
      syncThemeIcon()
    })
  }
}
