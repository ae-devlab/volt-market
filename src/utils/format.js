// Locale-aware formatting helpers (Bulgarian).

const priceFmt = new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'BGN',
  maximumFractionDigits: 0,
})
const numberFmt = new Intl.NumberFormat('bg-BG')
const dateFmt = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium' })

export const formatPrice = (value) => priceFmt.format(Number(value || 0))
export const formatNumber = (value) => numberFmt.format(Number(value || 0))
export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '')

export const formatMileage = (km) => (km || km === 0 ? `${formatNumber(km)} км` : '—')
export const formatRange = (km) => (km ? `${formatNumber(km)} км` : '—')
export const formatBattery = (kwh) => (kwh ? `${kwh} kWh` : '—')
export const formatYear = (year) => (year ? String(year) : '—')

export const CONDITION_LABELS = {
  new: 'Нов',
  used: 'Употребяван',
}

export const STATUS_LABELS = {
  pending: { text: 'Изчаква одобрение', cls: 'bg-warning text-dark', icon: 'bi-hourglass-split' },
  approved: { text: 'Одобрена', cls: 'bg-success', icon: 'bi-check-circle' },
  rejected: { text: 'Отхвърлена', cls: 'bg-danger', icon: 'bi-x-circle' },
  sold: { text: 'Продадена', cls: 'bg-secondary', icon: 'bi-bag-check' },
}
