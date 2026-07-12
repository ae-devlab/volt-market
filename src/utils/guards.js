// Route guards for multi-page navigation. Redirect on the client for UX;
// the real enforcement is the RLS policies in the database.
import { getSession, isAdmin } from '../services/auth.js'

export async function requireAuth(redirect = '/login.html') {
  const session = await getSession()
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search)
    location.href = `${redirect}?next=${next}`
    return null
  }
  return session
}

export async function requireAdmin(redirect = '/index.html') {
  const session = await requireAuth()
  if (!session) return null
  if (!(await isAdmin())) {
    location.href = redirect
    return null
  }
  return session
}

export async function redirectIfAuth(to = '/dashboard.html') {
  const session = await getSession()
  if (session) location.href = to
}
