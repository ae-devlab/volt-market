import { qs } from '../utils/dom.js'

export function renderFooter() {
  const mount = qs('#site-footer')
  if (!mount) return
  const year = new Date().getFullYear()
  mount.innerHTML = `
  <footer class="site-footer mt-5 py-4">
    <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
      <span class="fw-semibold" style="color: var(--vm-heading)">
        <i class="bi bi-lightning-charge-fill text-warning"></i> VoltMarket
      </span>
      <span class="small text-muted">Пазар за електрически автомобили · SoftUni AI Capstone</span>
      <span class="small text-muted">© ${year} · Изградено с AI-assisted development</span>
    </div>
  </footer>`
}
