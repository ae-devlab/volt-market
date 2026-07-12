import '../lib/theme.js'
import { onReady, qs } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { requireAuth } from '../utils/guards.js'
import { createImageUploader } from '../components/imageUploader.js'
import { create } from '../services/listings.js'
import { fillCategorySelect, readListingForm } from '../utils/listingForm.js'
import { friendlyError } from '../utils/errors.js'
import { required, firstError } from '../utils/validation.js'
import { showToast } from '../components/toast.js'

onReady(async () => {
  renderNavbar('sell')
  renderFooter()
  const session = await requireAuth()
  if (!session) return

  await fillCategorySelect(qs('#category'))
  const uploader = createImageUploader(qs('#uploader'), { max: 6 })

  const form = qs('#listing-form')
  const errorBox = qs('#error')
  const btn = qs('#submit-btn')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorBox.classList.add('d-none')

    const payload = readListingForm()
    const validationError = firstError(
      required(payload.title, 'Заглавието'),
      required(payload.category_id, 'Категорията'),
      required(payload.price, 'Цената'),
    )
    if (validationError) {
      errorBox.textContent = validationError
      errorBox.classList.remove('d-none')
      return
    }

    btn.disabled = true
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Публикуване…'
    try {
      await create(payload, uploader.getFiles())
      showToast('Обявата е изпратена за одобрение!', 'success')
      setTimeout(() => (location.href = '/dashboard.html'), 900)
    } catch (err) {
      errorBox.textContent = friendlyError(err)
      errorBox.classList.remove('d-none')
      btn.disabled = false
      btn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Публикувай'
    }
  })
})
