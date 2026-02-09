/**
 * Standard error handling hook for API operations
 * 
 * Provides a consistent pattern for error handling across all API hooks.
 * This hook standardizes error extraction, state management, and error reporting.
 * 
 * @example
 * ```tsx
 * import { useErrorHandling } from '@/hooks/utils/useErrorHandling'
 * 
 * function useMyApiHook() {
 *   const { handleError, error, setError, clearError } = useErrorHandling()
 *   
 *   const fetchData = async () => {
 *     try {
 *       const res = await api.get('/data')
 *       return res.data
 *     } catch (err) {
 *       handleError(err, 'Ошибка загрузки данных')
 *       throw err
 *     }
 *   }
 * }
 * ```
 */

import { useState, useCallback } from 'react'
import { getErrorMessage } from '../../utils/errors'

/**
 * Options for error handling hook
 */
export interface UseErrorHandlingOptions {
  /** Default error message if error cannot be extracted */
  defaultErrorMessage?: string
  /** Callback when error occurs */
  onError?: (error: string, originalError: unknown) => void
}

/**
 * Result of error handling hook
 */
export interface UseErrorHandlingResult {
  /** Current error message (empty string if no error) */
  error: string
  /** Handle an error and extract user-friendly message */
  handleError: (error: unknown, defaultMessage?: string) => string
  /** Manually set error message */
  setError: (error: string) => void
  /** Clear error state */
  clearError: () => void
}

/**
 * Hook for standardized error handling in API operations
 * 
 * Provides consistent error handling pattern:
 * - Automatic error message extraction using getErrorMessage
 * - Error state management
 * - Optional error callbacks
 * 
 * @param options - Error handling configuration
 * @returns Object containing error state and handlers
 * 
 * @example
 * ```tsx
 * const { error, handleError, clearError } = useErrorHandling({
 *   defaultErrorMessage: 'Произошла ошибка',
 *   onError: (message) => {
 *     toast.error(message)
 *   },
 * })
 * 
 * try {
 *   await apiCall()
 * } catch (err) {
 *   handleError(err, 'Не удалось выполнить операцию')
 * }
 * ```
 */
export function useErrorHandling(
  options: UseErrorHandlingOptions = {}
): UseErrorHandlingResult {
  const {
    defaultErrorMessage = 'Произошла ошибка',
    onError,
  } = options

  const [error, setErrorState] = useState<string>('')

  /**
   * Handle an error and extract user-friendly message
   * @param err - Error object from API call or any error type
   * @param customDefaultMessage - Custom default message (overrides hook default)
   * @returns Extracted error message
   */
  const handleError = useCallback(
    (err: unknown, customDefaultMessage?: string): string => {
      const message = getErrorMessage(err, customDefaultMessage || defaultErrorMessage)
      setErrorState(message)
      
      if (onError) {
        onError(message, err)
      }
      
      return message
    },
    [defaultErrorMessage, onError]
  )

  /**
   * Manually set error message
   * @param errorMessage - Error message to set
   */
  const setError = useCallback((errorMessage: string) => {
    setErrorState(errorMessage)
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState('')
  }, [])

  return {
    error,
    handleError,
    setError,
    clearError,
  }
}

