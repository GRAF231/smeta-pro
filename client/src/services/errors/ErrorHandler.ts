/**
 * Centralized error handling service
 * 
 * Provides unified error handling across the application with:
 * - Error categorization
 * - User-friendly error messages
 * - Error logging
 * - Custom error handlers
 */

import type { AppError, ErrorCategory, ErrorSeverity, ErrorHandlerConfig } from '../../types'
import { getErrorMessage, isUnauthorizedError, isNotFoundError, extractApiErrorResponse } from '../../utils/errors'

/**
 * Default error handler configuration
 */
const defaultConfig: ErrorHandlerConfig = {
  logToConsole: true,
  showNotification: true,
}

/**
 * Class for centralized error handling
 */
class ErrorHandler {
  private config: ErrorHandlerConfig

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Categorize error based on status code and error type
   * @param error - Error object
   * @returns Error category
   */
  private categorizeError(error: unknown): ErrorCategory {
    if (isUnauthorizedError(error)) {
      return 'authentication'
    }

    if (isNotFoundError(error)) {
      return 'notFound'
    }

    if (typeof error === 'object' && error !== null && 'response' in error) {
      const apiError = error as { response?: { status?: number } }
      const status = apiError.response?.status

      if (status === 403) {
        return 'authorization'
      }
      if (status === 400 || status === 422) {
        return 'validation'
      }
      if (status === 500 || status === 502 || status === 503) {
        return 'server'
      }
      if (status === 408 || status === 504) {
        return 'timeout'
      }
      if (status && status >= 500) {
        return 'server'
      }
    }

    // Check for network errors
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('timeout')) {
        return 'network'
      }
    }

    return 'unknown'
  }

  /**
   * Determine error severity based on category
   * @param category - Error category
   * @returns Error severity level
   */
  private getSeverity(category: ErrorCategory): ErrorSeverity {
    switch (category) {
      case 'authentication':
      case 'authorization':
      case 'server':
        return 'error'
      case 'validation':
      case 'notFound':
        return 'warning'
      case 'network':
      case 'timeout':
        return 'error'
      default:
        return 'error'
    }
  }

  /**
   * Get user-friendly error message based on category
   * @param error - Original error
   * @param category - Error category
   * @param defaultMessage - Default message fallback
   * @returns User-friendly error message
   */
  private getUserMessage(
    error: unknown,
    category: ErrorCategory,
    defaultMessage: string
  ): string {
    const extractedMessage = getErrorMessage(error, defaultMessage)

    // If we have a specific message from the API, use it
    if (extractedMessage !== defaultMessage) {
      return extractedMessage
    }

    // Otherwise, provide category-based messages
    switch (category) {
      case 'authentication':
        return 'Сессия истекла. Пожалуйста, войдите снова.'
      case 'authorization':
        return 'У вас нет доступа к этому ресурсу.'
      case 'validation':
        return 'Проверьте правильность введенных данных.'
      case 'notFound':
        return 'Запрашиваемый ресурс не найден.'
      case 'network':
        return 'Ошибка сети. Проверьте подключение к интернету.'
      case 'timeout':
        return 'Превышено время ожидания. Попробуйте еще раз.'
      case 'server':
        return 'Ошибка сервера. Попробуйте позже.'
      default:
        return defaultMessage
    }
  }

  /**
   * Extract status code from error
   * @param error - Error object
   * @returns HTTP status code or undefined
   */
  private getStatusCode(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const apiError = error as { response?: { status?: number } }
      return apiError.response?.status
    }
    return undefined
  }

  /**
   * Handle error and convert to AppError
   * @param error - Error to handle
   * @param defaultMessage - Default error message
   * @param context - Additional error context
   * @returns Structured AppError object
   */
  handle(
    error: unknown,
    defaultMessage = 'Произошла ошибка',
    context?: Record<string, unknown>
  ): AppError {
    const category = this.categorizeError(error)
    const severity = this.getSeverity(category)
    const message = this.getUserMessage(error, category, defaultMessage)
    const statusCode = this.getStatusCode(error)

    const apiError = extractApiErrorResponse(error)
    
    const appError: AppError = {
      message,
      category,
      severity,
      statusCode,
      originalError: error,
      context,
      apiError: apiError || undefined,
    }

    // Log error if configured
    if (this.config.logToConsole) {
      console.error('[ErrorHandler]', {
        message: appError.message,
        category: appError.category,
        severity: appError.severity,
        statusCode: appError.statusCode,
        context: appError.context,
        originalError: error,
      })
    }

    // Show toast notification if configured
    if (this.config.showNotification && this.config.showToast) {
      this.config.showToast(appError.message, appError.severity)
    }

    // Call custom error handler if provided
    if (this.config.onError) {
      this.config.onError(appError)
    }

    return appError
  }

  /**
   * Update error handler configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * Default error handler instance
 */
export const errorHandler = new ErrorHandler()

/**
 * Create a new error handler instance with custom configuration
 * @param config - Error handler configuration
 * @returns New ErrorHandler instance
 */
export function createErrorHandler(config: ErrorHandlerConfig): ErrorHandler {
  return new ErrorHandler(config)
}

