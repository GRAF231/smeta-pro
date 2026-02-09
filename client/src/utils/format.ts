const MONTH_NAMES_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

/**
 * Format number with Russian locale (space as thousands separator).
 * Example: 1234567 → "1 234 567"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num)
}

/**
 * Format number as money with 2 decimal places.
 * Example: 1234.5 → "1 234,50"
 */
export function formatMoney(num: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Format ISO date string to Russian date with month name.
 * Example: "2026-02-09" → "09 февраля 2026 г."
 */
export function formatDateRu(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate().toString().padStart(2, '0')
  const month = MONTH_NAMES_RU[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year} г.`
}

/**
 * Format ISO date string to short Russian date.
 * Example: "2026-02-09" → "09.02.2026"
 */
export function formatDateShortRu(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

