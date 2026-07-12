import '../lib/theme.js'
import { onReady, qs } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { register } from '../services/auth.js'
import { redirectIfAuth } from '../utils/guards.js'
import { friendlyError } from '../utils/errors.js'
import { required, emailRule, minLen, firstError } from '../utils/validation.js'

onReady(async () => {
  renderNavbar()
  renderFooter()
  await redirectIfAuth('/dashboard.html')

  const form = qs('#register-form')
  const errorBox = qs('#error')
  const successBox = qs('#success')
  const btn = qs('#submit-btn')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorBox.classList.add('d-none')
    successBox.classList.add('d-none')

    const username = qs('#username').value.trim()
    const fullName = qs('#fullName').value.trim()
    const email = qs('#email').value.trim()
    const password = qs('#password').value

    const validationError = firstError(
      required(username, 'Потребителското име'),
      emailRule(email),
      minLen(password, 6, 'Паролата'),
    )
    if (validationError) {
      errorBox.textContent = validationError
      errorBox.classList.remove('d-none')
      return
    }

    btn.disabled = true
    btn.textContent = 'Създаване…'
    try {
      const result = await register({ email, password, username, fullName })
      if (result.session) {
        location.href = '/dashboard.html'
      } else {
        successBox.textContent = 'Профилът е създаден! Вече можеш да влезеш.'
        successBox.classList.remove('d-none')
        form.reset()
        btn.disabled = false
        btn.textContent = 'Създай профил'
      }
    } catch (err) {
      errorBox.textContent = friendlyError(err)
      errorBox.classList.remove('d-none')
      btn.disabled = false
      btn.textContent = 'Създай профил'
    }
  })
})
