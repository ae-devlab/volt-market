import { el } from '../utils/dom.js'

function getContainer() {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = el('div', {
      id: 'toast-container',
      class: 'toast-container position-fixed bottom-0 end-0 p-3',
      style: 'z-index: 1090',
    })
    document.body.append(container)
  }
  return container
}

const ICONS = {
  success: 'bi-check-circle',
  danger: 'bi-exclamation-octagon',
  warning: 'bi-exclamation-triangle',
  info: 'bi-info-circle',
}

export function showToast(message, type = 'success') {
  const toast = el(
    'div',
    { class: `toast align-items-center text-bg-${type} border-0`, role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'true' },
    el(
      'div',
      { class: 'd-flex' },
      el('div', { class: 'toast-body' }, el('i', { class: `bi ${ICONS[type] || ICONS.info} me-2` }), message),
      el('button', {
        type: 'button',
        class: 'btn-close btn-close-white me-2 m-auto',
        'data-bs-dismiss': 'toast',
        'aria-label': 'Затвори',
      }),
    ),
  )
  getContainer().append(toast)

  const Toast = globalThis.bootstrap?.Toast
  if (Toast) {
    const instance = new Toast(toast, { delay: 3500 })
    instance.show()
    toast.addEventListener('hidden.bs.toast', () => toast.remove())
  } else {
    setTimeout(() => toast.remove(), 3500)
  }
}
