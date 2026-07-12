import '../lib/theme.js'
import { onReady, qs, el, getParam } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { requireAuth } from '../utils/guards.js'
import { getUser, isAdmin } from '../services/auth.js'
import { createImageUploader } from '../components/imageUploader.js'
import { getById, update, addImages, removeImage } from '../services/listings.js'
import { fillCategorySelect, fillListingForm, readListingForm } from '../utils/listingForm.js'
import { friendlyError } from '../utils/errors.js'
import { required, firstError } from '../utils/validation.js'
import { showToast } from '../components/toast.js'

function renderExistingImages(images) {
  const wrap = qs('#existing-images')
  wrap.innerHTML = ''
  if (!images.length) {
    wrap.innerHTML = '<span class="text-muted small">Няма качени снимки.</span>'
    return
  }
  images.forEach((img) => {
    const thumb = el(
      'div',
      { class: 'position-relative' },
      el('img', { src: img.url, class: 'rounded border', style: 'width:96px;height:72px;object-fit:cover' }),
      img.is_primary ? el('span', { class: 'badge text-bg-primary position-absolute bottom-0 start-0 m-1' }, 'Основна') : null,
      el('button', {
        type: 'button',
        class: 'btn btn-danger btn-sm position-absolute top-0 end-0 py-0 px-1',
        title: 'Изтрий снимката',
        onClick: async () => {
          if (!confirm('Да изтрия ли тази снимка?')) return
          try {
            await removeImage(img)
            thumb.remove()
          } catch (err) {
            showToast(friendlyError(err), 'danger')
          }
        },
      }, '×'),
    )
    wrap.append(thumb)
  })
}

onReady(async () => {
  renderNavbar()
  renderFooter()
  const session = await requireAuth()
  if (!session) return

  const id = getParam('id')
  if (!id) {
    location.href = '/dashboard.html'
    return
  }

  const loading = qs('#loading')
  const form = qs('#listing-form')
  const errorBox = qs('#error')
  const btn = qs('#submit-btn')

  let listing
  try {
    listing = await getById(id)
  } catch {
    loading.classList.add('d-none')
    errorBox.textContent = 'Обявата не е намерена.'
    errorBox.classList.remove('d-none')
    return
  }

  const user = await getUser()
  const admin = await isAdmin()
  if (listing.seller_id !== user.id && !admin) {
    location.href = '/dashboard.html'
    return
  }

  await fillCategorySelect(qs('#category'), listing.category_id)
  fillListingForm(listing)
  renderExistingImages(listing.images)
  const uploader = createImageUploader(qs('#uploader'), { max: 6 })

  loading.classList.add('d-none')
  form.classList.remove('d-none')

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
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Запазване…'
    try {
      await update(id, payload)
      const files = uploader.getFiles()
      if (files.length) await addImages(id, files, { hasExisting: listing.images.length > 0 })
      showToast('Промените са запазени.', 'success')
      setTimeout(() => (location.href = '/dashboard.html'), 800)
    } catch (err) {
      errorBox.textContent = friendlyError(err)
      errorBox.classList.remove('d-none')
      btn.disabled = false
      btn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Запази промените'
    }
  })
})
