/**
 * Hook for using ErrorHandler with Toast integration
 * 
 * Provides a convenient way to handle errors with automatic toast notifications
 * 
 * @example
 * ```tsx
 * const { handleError } = useErrorHandler()
 * 
 * try {
 *   await someOperation()
 * } catch (error) {
 *   handleError(error, 'Не удалось выполнить операцию')
 * }
 * ```
 */

import { useCallback } from 'react'
import { errorHandler } from '../services/errors'
import { useToast } from '../components/ui/ToastContainer'
import type { AppError } from '../types'

/**
 * Error handler hook return type
 */
export interface UseErrorHandlerReturn {
  /**
   * Handle an error with automatic toast notification
   * @param error - Error to handle
   * @param defaultMessage - Default error message if error cannot be extracted
   * @param context - Additional error context
   * @returns Structured AppError object
   */
  handleError: (
    error: unknown,
    defaultMessage?: string,
    context?: Record<string, unknown>
  ) => AppError
}

/**
 * Hook for error handling with toast notifications
 * 
 * Creates an error handler instance configured to show toast notifications
 * using the Toast context.
 * 
 * @returns Error handler functions
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const { showToast } = useToast()

  const handleError = useCallback(
    (
      error: unknown,
      defaultMessage = 'Произошла ошибка',
      context?: Record<string, unknown>
    ): AppError => {
      // Create a temporary error handler with toast integration
      const handler = errorHandler
      handler.updateConfig({
        showNotification: true,
        showToast: (message, severity, duration) => {
          showToast(message, severity, duration)
        },
      })

      return handler.handle(error, defaultMessage, context)
    },
    [showToast]
  )

  return { handleError }
}

