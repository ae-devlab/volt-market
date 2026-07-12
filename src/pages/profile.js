import '../lib/theme.js'
import { onReady, qs } from '../utils/dom.js'
import { renderNavbar } from '../components/navbar.js'
import { renderFooter } from '../components/footer.js'
import { requireAuth } from '../utils/guards.js'
import { getCurrentProfile, updateProfile, getUser } from '../services/auth.js'
import { uploadAvatar } from '../services/storage.js'
import { showToast } from '../components/toast.js'
import { friendlyError } from '../utils/errors.js'

const AVATAR_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="#dee2e6"/><text x="50%" y="55%" font-size="56" text-anchor="middle" fill="#adb5bd">👤</text></svg>',
  )

onReady(async () => {
  renderNavbar()
  renderFooter()
  const session = await requireAuth()
  if (!session) return

  const loading = qs('#loading')
  const form = qs('#profile-form')
  const errorBox = qs('#error')
  const btn = qs('#submit-btn')

  let profile
  try {
    profile = await getCurrentProfile()
  } catch (err) {
    loading.classList.add('d-none')
    errorBox.textContent = friendlyError(err)
    errorBox.classList.remove('d-none')
    return
  }

  qs('#username').value = profile.username || ''
  qs('#fullName').value = profile.full_name || ''
  qs('#phone').value = profile.phone || ''
  qs('#location').value = profile.location || ''
  qs('#bio').value = profile.bio || ''
  qs('#avatar-preview').src = profile.avatar_url || AVATAR_PLACEHOLDER

  loading.classList.add('d-none')
  form.classList.remove('d-none')

  qs('#avatar').addEventListener('change', async () => {
    const file = qs('#avatar').files[0]
    if (!file) return
    try {
      const user = await getUser()
      const url = await uploadAvatar(file, user.id)
      await updateProfile({ avatar_url: url })
      qs('#avatar-preview').src = url
      showToast('Профилната снимка е обновена.', 'success')
    } catch (err) {
      showToast(friendlyError(err), 'danger')
    }
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorBox.classList.add('d-none')
    btn.disabled = true
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Запазване…'
    try {
      await updateProfile({
        username: qs('#username').value.trim() || null,
        full_name: qs('#fullName').value.trim() || null,
        phone: qs('#phone').value.trim() || null,
        location: qs('#location').value.trim() || null,
        bio: qs('#bio').value.trim() || null,
      })
      showToast('Профилът е запазен.', 'success')
    } catch (err) {
      errorBox.textContent = friendlyError(err)
      errorBox.classList.remove('d-none')
    } finally {
      btn.disabled = false
      btn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Запази'
    }
  })
})
