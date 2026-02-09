/**
 * Error handling utilities
 */

import { HTTP_STATUS } from '../constants/api'
import type { ApiErrorResponse, AxiosLikeError } from '../types'

/**
 * Type guard to check if error is an Axios-like error
 * @param error - Error to check
 * @returns True if error has Axios-like structure
 */
export function isAxiosLikeError(error: unknown): error is AxiosLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as AxiosLikeError).response === 'object'
  )
}

/**
 * Type guard to check if error is an API error response
 * @param error - Error to check
 * @returns True if error is API error response
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'error' in error || 'status' in error)
  )
}

/**
 * Extract API error response from various error formats
 * @param error - Error object
 * @returns API error response or null
 */
export function extractApiErrorResponse(error: unknown): ApiErrorResponse | null {
  if (isAxiosLikeError(error)) {
    return error.response?.data || null
  }
  if (isApiErrorResponse(error)) {
    return error
  }
  return null
}

/**
 * Extract user-friendly error message from API error or other error types
 * 
 * Handles various error formats:
 * - Axios errors with response.data.error or response.data.message
 * - Standard Error objects
 * - String errors
 * - Unknown error types
 * 
 * @param error - Error object from API call or any error type
 * @param defaultMessage - Default message if error cannot be extracted (default: 'Произошла ошибка')
 * @returns User-friendly error message string
 * 
 * @example
 * ```tsx
 * try {
 *   await api.createProject(data)
 * } catch (err) {
 *   const message = getErrorMessage(err, 'Не удалось создать проект')
 *   setError(message)
 * }
 * ```
 */
export function getErrorMessage(error: unknown, defaultMessage = 'Произошла ошибка'): string {
  if (!error) return defaultMessage

  // Try to extract API error response
  const apiError = extractApiErrorResponse(error)
  if (apiError) {
    return apiError.message || apiError.error || defaultMessage
  }

  // Check if it's an Axios-like error
  if (isAxiosLikeError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      defaultMessage
    )
  }

  // Check if it's an Error object
  if (error instanceof Error) {
    return error.message || defaultMessage
  }

  // Check if it's a string
  if (typeof error === 'string') {
    return error
  }

  return defaultMessage
}

/**
 * Check if error is an unauthorized error (401)
 * @param error - Error object
 * @returns True if error is 401 Unauthorized
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (isAxiosLikeError(error)) {
    return error.response?.status === HTTP_STATUS.UNAUTHORIZED
  }
  const apiError = extractApiErrorResponse(error)
  return apiError?.status === HTTP_STATUS.UNAUTHORIZED
}

/**
 * Check if error is a not found error (404)
 * @param error - Error object
 * @returns True if error is 404 Not Found
 */
export function isNotFoundError(error: unknown): boolean {
  if (isAxiosLikeError(error)) {
    return error.response?.status === HTTP_STATUS.NOT_FOUND
  }
  const apiError = extractApiErrorResponse(error)
  return apiError?.status === HTTP_STATUS.NOT_FOUND
}

/**
 * Check if error is a validation error (400 or 422)
 * @param error - Error object
 * @returns True if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (isAxiosLikeError(error)) {
    const status = error.response?.status
    return status === 400 || status === 422
  }
  const apiError = extractApiErrorResponse(error)
  return apiError?.status === 400 || apiError?.status === 422
}

/**
 * Check if error is a server error (5xx)
 * @param error - Error object
 * @returns True if error is a server error
 */
export function isServerError(error: unknown): boolean {
  if (isAxiosLikeError(error)) {
    const status = error.response?.status
    return status !== undefined && status >= 500 && status < 600
  }
  const apiError = extractApiErrorResponse(error)
  return apiError?.status !== undefined && apiError.status >= 500 && apiError.status < 600
}

/**
 * Check if error is a network error
 * @param error - Error object
 * @returns True if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosLikeError(error)) {
    return error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || false
  }
  if (error instanceof Error) {
    return error.message.includes('Network Error') || error.message.includes('timeout')
  }
  return false
}

