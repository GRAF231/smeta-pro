import { ValidationError } from './errors'

/**
 * Проверка обязательного поля
 */
export function requireField<T>(value: T | undefined | null, fieldName: string): T {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} обязательно`)
  }
  return value
}

/**
 * Проверка обязательного поля строки
 */
export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} обязательно`)
  }
  return value.trim()
}

/**
 * Проверка email
 */
export function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Неверный формат email')
  }
  return email
}

/**
 * Проверка пароля
 */
export function validatePassword(password: string, minLength: number = 6): string {
  if (password.length < minLength) {
    throw new ValidationError(`Пароль должен быть минимум ${minLength} символов`)
  }
  return password
}

/**
 * Проверка URL
 */
export function validateUrl(url: string, fieldName: string = 'URL'): string {
  try {
    new URL(url)
    return url
  } catch {
    throw new ValidationError(`Неверный формат ${fieldName}`)
  }
}

/**
 * Проверка массива
 */
export function requireArray<T>(
  value: unknown,
  fieldName: string,
  minLength: number = 1
): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} должен быть массивом`)
  }
  if (value.length < minLength) {
    throw new ValidationError(`${fieldName} должен содержать минимум ${minLength} элемент(ов)`)
  }
  return value as T[]
}

/**
 * Проверка числа
 */
export function requireNumber(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): number {
  const num = Number(value)
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} должен быть числом`)
  }
  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} должен быть не менее ${min}`)
  }
  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} должен быть не более ${max}`)
  }
  return num
}

/**
 * Проверка значения из списка допустимых
 */
export function requireEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): T {
  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} должен быть одним из: ${allowedValues.join(', ')}`
    )
  }
  return value as T
}

/**
 * Проверка Google Sheets URL и извлечение ID
 */
export function validateGoogleSheetUrl(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) {
    throw new ValidationError('Неверный формат ссылки на Google Таблицу')
  }
  return match[1]
}

/**
 * Проверка типа изображения акта
 */
export function validateActImageType(
  imageType: unknown
): 'logo' | 'stamp' | 'signature' {
  return requireEnum(imageType, 'Тип изображения', ['logo', 'stamp', 'signature'])
}

