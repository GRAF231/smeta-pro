/**
 * Formatting utility functions
 * 
 * Provides functions for formatting numbers, dates, and currency
 * according to Russian locale conventions.
 */

/**
 * Russian month names in genitive case (for dates)
 */
const MONTH_NAMES_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
] as const satisfies readonly string[]

/**
 * Format number with Russian locale (space as thousands separator).
 * @param num - Number to format
 * @returns Formatted number string
 * @example
 * formatNumber(1234567) // "1 234 567"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num)
}

/**
 * Format number as money with 2 decimal places.
 * @param num - Number to format
 * @returns Formatted money string
 * @example
 * formatMoney(1234.5) // "1 234,50"
 */
export function formatMoney(num: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Format ISO date string to Russian date with month name.
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string
 * @example
 * formatDateRu("2026-02-09") // "09 февраля 2026 г."
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
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string
 * @example
 * formatDateShortRu("2026-02-09") // "09.02.2026"
 */
export function formatDateShortRu(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

