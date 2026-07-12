import { qs } from '../utils/dom.js'

export function renderFooter() {
  const mount = qs('#site-footer')
  if (!mount) return
  const year = new Date().getFullYear()
  mount.innerHTML = `
  <footer class="bg-dark text-secondary mt-5 py-4 border-top border-secondary-subtle">
    <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
      <span class="fw-semibold text-light">
        <i class="bi bi-lightning-charge-fill text-warning"></i> VoltMarket
      </span>
      <span class="small">Пазар за електрически автомобили · SoftUni AI Capstone</span>
      <span class="small">© ${year} · Изградено с AI-assisted development</span>
    </div>
  </footer>`
}
