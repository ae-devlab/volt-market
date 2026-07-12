// Tiny DOM helpers — no framework, just ergonomics.

export const qs = (selector, root = document) => root.querySelector(selector)
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)]

/**
 * Create an element. attrs supports: class, dataset, html, on<Event> handlers,
 * and plain attributes. Children can be nodes, strings, arrays, or falsy (skipped).
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'html') node.innerHTML = value
    else if (key === 'dataset') Object.assign(node.dataset, value)
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value)
    } else node.setAttribute(key, value)
  }
  appendChildren(node, children)
  return node
}

function appendChildren(node, children) {
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    node.append(child.nodeType ? child : document.createTextNode(String(child)))
  }
}

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  )

export function setText(selector, text, root = document) {
  const node = qs(selector, root)
  if (node) node.textContent = text
}

export function show(node, visible = true) {
  if (node) node.classList.toggle('d-none', !visible)
}

export const getParam = (name) => new URLSearchParams(location.search).get(name)

export function onReady(fn) {
  if (document.readyState !== 'loading') fn()
  else document.addEventListener('DOMContentLoaded', fn, { once: true })
}
