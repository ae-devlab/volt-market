import { el } from '../utils/dom.js'

/**
 * A simple multi-image picker with thumbnail previews and per-image removal.
 * Returns a handle: { getFiles(), clear() }.
 */
export function createImageUploader(mount, { max = 6 } = {}) {
  let files = []

  const input = el('input', { type: 'file', accept: 'image/*', multiple: true, class: 'form-control' })
  const hint = el('div', { class: 'form-text' }, `До ${max} снимки. Първата става основна.`)
  const preview = el('div', { class: 'd-flex flex-wrap gap-2 mt-2' })

  const render = () => {
    preview.innerHTML = ''
    files.forEach((file, index) => {
      const url = URL.createObjectURL(file)
      const thumb = el('div', { class: 'position-relative' },
        el('img', { src: url, class: 'rounded border', style: 'width:96px;height:72px;object-fit:cover' }),
        index === 0 ? el('span', { class: 'badge text-bg-primary position-absolute bottom-0 start-0 m-1' }, 'Основна') : null,
        el('button', {
          type: 'button',
          class: 'btn btn-danger btn-sm position-absolute top-0 end-0 py-0 px-1',
          title: 'Премахни',
          onClick: () => {
            files.splice(index, 1)
            render()
          },
        }, '×'),
      )
      preview.append(thumb)
    })
  }

  input.addEventListener('change', () => {
    files = [...files, ...input.files].slice(0, max)
    input.value = ''
    render()
  })

  mount.append(input, hint, preview)
  return {
    getFiles: () => files,
    clear: () => {
      files = []
      render()
    },
  }
}
