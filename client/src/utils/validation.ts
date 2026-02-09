/**
 * Validation utility functions
 */

import { VALIDATION_LIMITS } from '../constants/ui'

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate email address format
 * 
 * Checks if email matches standard email format (user@domain.tld).
 * Returns error if email is empty or invalid format.
 * 
 * @param email - Email string to validate
 * @returns Validation result with isValid flag and optional error message
 * 
 * @example
 * ```tsx
 * const result = validateEmail('user@example.com')
 * if (!result.isValid) {
 *   console.error(result.error) // 'Некорректный email адрес'
 * }
 * ```
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email обязателен для заполнения' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email.trim())
  return isValid
    ? { isValid: true }
    : { isValid: false, error: 'Некорректный email адрес' }
}

/**
 * Check if email format is valid (returns boolean only)
 * 
 * Similar to validateEmail but returns only boolean without error message.
 * Useful for simple checks where error message is not needed.
 * 
 * @param email - Email string to validate
 * @returns True if email format is valid, false otherwise
 * 
 * @example
 * ```tsx
 * if (isValidEmail(email)) {
 *   // Email is valid
 * }
 * ```
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validate URL format
 * 
 * Checks if string is a valid HTTP or HTTPS URL.
 * Uses URL constructor for validation.
 * 
 * @param url - URL string to validate
 * @returns True if URL is valid HTTP/HTTPS URL, false otherwise
 * 
 * @example
 * ```tsx
 * if (isValidUrl(googleSheetUrl)) {
 *   // URL is valid
 * }
 * ```
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate password strength
 * 
 * Checks if password meets minimum length requirement.
 * Uses VALIDATION_LIMITS.MIN_PASSWORD_LENGTH constant.
 * 
 * @param password - Password string to validate
 * @returns Object with isValid flag and optional error message
 * 
 * @example
 * ```tsx
 * const result = validatePassword('password123')
 * if (!result.isValid) {
 *   console.error(result.error) // 'Пароль должен содержать минимум 6 символов'
 * }
 * ```
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < VALIDATION_LIMITS.MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Пароль должен содержать минимум ${VALIDATION_LIMITS.MIN_PASSWORD_LENGTH} символов`,
    }
  }
  return { isValid: true }
}

/**
 * Validate that a string value is not empty
 * 
 * Checks if value exists and is not empty after trimming whitespace.
 * 
 * @param value - String value to validate
 * @param fieldName - Name of the field for error message (default: 'Поле')
 * @returns Object with isValid flag and optional error message
 * 
 * @example
 * ```tsx
 * const result = validateRequired(title, 'Название проекта')
 * if (!result.isValid) {
 *   console.error(result.error) // 'Название проекта обязательно для заполнения'
 * }
 * ```
 */
export function validateRequired(value: string, fieldName = 'Поле'): { isValid: boolean; error?: string } {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} обязательно для заполнения`,
    }
  }
  return { isValid: true }
}

/**
 * Validate string length is within specified range
 * 
 * Checks if trimmed string length is between min and max (inclusive).
 * 
 * @param value - String value to validate
 * @param min - Minimum allowed length
 * @param max - Maximum allowed length
 * @param fieldName - Name of the field for error message (default: 'Поле')
 * @returns Object with isValid flag and optional error message
 * 
 * @example
 * ```tsx
 * const result = validateLength(description, 10, 500, 'Описание')
 * if (!result.isValid) {
 *   console.error(result.error) // 'Описание должно содержать минимум 10 символов'
 * }
 * ```
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName = 'Поле'
): { isValid: boolean; error?: string } {
  const length = value.trim().length
  if (length < min) {
    return {
      isValid: false,
      error: `${fieldName} должно содержать минимум ${min} символов`,
    }
  }
  if (length > max) {
    return {
      isValid: false,
      error: `${fieldName} должно содержать максимум ${max} символов`,
    }
  }
  return { isValid: true }
}

/**
 * Validate that a number is positive (greater than zero)
 * 
 * Checks if value is a valid number and greater than zero.
 * 
 * @param value - Number value to validate
 * @param fieldName - Name of the field for error message (default: 'Значение')
 * @returns Object with isValid flag and optional error message
 * 
 * @example
 * ```tsx
 * const result = validatePositiveNumber(quantity, 'Количество')
 * if (!result.isValid) {
 *   console.error(result.error) // 'Количество должно быть положительным числом'
 * }
 * ```
 */
export function validatePositiveNumber(
  value: number,
  fieldName = 'Значение'
): { isValid: boolean; error?: string } {
  if (isNaN(value) || value <= 0) {
    return {
      isValid: false,
      error: `${fieldName} должно быть положительным числом`,
    }
  }
  return { isValid: true }
}

