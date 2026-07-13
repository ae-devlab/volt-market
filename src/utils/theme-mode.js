// Light/dark theme mode — persisted in localStorage, applied via data-bs-theme.
const KEY = 'vm-theme'

export const currentTheme = () =>
  document.documentElement.getAttribute('data-bs-theme') || 'dark'

export function setTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* private mode — non-fatal */
  }
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
