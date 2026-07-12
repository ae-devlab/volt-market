// Small validation helpers. Each rule returns an error string or null.

export const required = (value, label) =>
  !value || String(value).trim() === '' ? `${label} е задължително.` : null

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''))

export const emailRule = (value) =>
  isEmail(value) ? null : 'Въведи валиден имейл адрес.'

export const minLen = (value, n, label) =>
  String(value || '').length < n ? `${label} трябва да е поне ${n} символа.` : null

export const isPositiveNumber = (value, label) =>
  Number.isFinite(Number(value)) && Number(value) >= 0 ? null : `${label} трябва да е валидно число.`

/** Returns the first non-null error from a list of rule results. */
export const firstError = (...results) => results.find((r) => r) || null
