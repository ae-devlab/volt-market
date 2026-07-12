import '../lib/theme.js'
import { onReady, qs, getParam } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { login } from '../services/auth.js'
import { redirectIfAuth, safeNext } from '../utils/guards.js'
import { friendlyError } from '../utils/errors.js'

onReady(async () => {
  renderNavbar()
  renderFooter()

  const next = safeNext(getParam('next'))
  await redirectIfAuth(next)

  const form = qs('#login-form')
  const errorBox = qs('#error')
  const btn = qs('#submit-btn')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorBox.classList.add('d-none')
    btn.disabled = true
    btn.textContent = 'Влизане…'
    try {
      await login({
        email: qs('#email').value.trim(),
        password: qs('#password').value,
      })
      location.href = next
    } catch (err) {
      errorBox.textContent = friendlyError(err)
      errorBox.classList.remove('d-none')
      btn.disabled = false
      btn.textContent = 'Вход'
    }
  })
})
