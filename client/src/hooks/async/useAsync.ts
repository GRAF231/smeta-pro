/**
 * Universal hook for async operations
 * 
 * Provides a reusable pattern for handling async operations with:
 * - Automatic loading state management
 * - Error handling and extraction
 * - Data state management
 * - Cancellation support
 */

import { useCallback, useRef, useEffect } from 'react'
import { useAsyncState, type AsyncState } from './useAsyncState'
import { getErrorMessage } from '../../utils/errors'

/**
 * Options for async operation
 */
export interface UseAsyncOptions<T> {
  /** Initial data value */
  initialData?: T | null
  /** Default error message */
  defaultErrorMessage?: string
  /** Whether to throw errors (default: false) */
  throwOnError?: boolean
  /** Callback when operation succeeds */
  onSuccess?: (data: T) => void
  /** Callback when operation fails */
  onError?: (error: unknown) => void
  /** Whether to clear error on new operation start */
  clearErrorOnStart?: boolean
}

/**
 * Result of async operation
 */
export interface UseAsyncResult<T> extends AsyncState<T> {
  /** Execute async operation */
  execute: (...args: unknown[]) => Promise<T | undefined>
  /** Reset state to initial */
  reset: () => void
  /** Manually set data */
  setData: (data: T | null) => void
  /** Manually set error */
  setError: (error: string) => void
}

/**
 * Universal hook for async operations
 * 
 * Provides a standardized way to handle async operations with automatic
 * state management (loading, error, data).
 * 
 * @template T - Return type of async function
 * @param asyncFn - Async function to execute
 * @param options - Configuration options
 * @returns Object containing state and execute function
 * 
 * @example
 * ```tsx
 * const fetchUser = async (id: string) => {
 *   const res = await api.get(`/users/${id}`)
 *   return res.data
 * }
 * 
 * const { data, isLoading, error, execute } = useAsync(fetchUser, {
 *   defaultErrorMessage: 'Failed to load user',
 *   onSuccess: (user) => console.log('User loaded:', user),
 * })
 * 
 * // Execute operation
 * useEffect(() => {
 *   execute(userId)
 * }, [userId])
 * ```
 */
export function useAsync<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncResult<T> {
  const {
    initialData = null,
    defaultErrorMessage = 'Произошла ошибка',
    throwOnError = false,
    onSuccess,
    onError,
    clearErrorOnStart = true,
  } = options

  const {
    data,
    isLoading,
    error,
    setData,
    setLoading,
    setError,
    reset: resetState,
  } = useAsyncState<T>()

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize data if provided
  useEffect(() => {
    if (data === null && initialData !== null) {
      setData(initialData)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Execute async operation
   */
  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      // Cancel previous operation if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this operation
      abortControllerRef.current = new AbortController()

      if (clearErrorOnStart) {
        setError('')
      }
      setLoading(true)

      try {
        const result = await asyncFn(...args)

        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          return undefined
        }

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setData(result)
          setLoading(false)

          if (onSuccess) {
            onSuccess(result)
          }
        }

        return result
      } catch (err) {
        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          return undefined
        }

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          const errorMessage = getErrorMessage(err, defaultErrorMessage)
          setError(errorMessage)
          setLoading(false)

          if (onError) {
            onError(err)
          }

          if (throwOnError) {
            throw err
          }
        }

        return undefined
      }
    },
    [
      asyncFn,
      defaultErrorMessage,
      throwOnError,
      onSuccess,
      onError,
      clearErrorOnStart,
      setData,
      setLoading,
      setError,
    ]
  )

  /**
   * Reset state to initial
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    resetState()
  }, [resetState])

  return {
    data: data ?? (initialData ?? null),
    isLoading,
    error,
    execute,
    reset,
    setData,
    setError,
  }
}

/**
 * Hook for async operations that don't return data
 * 
 * Useful for operations like delete, update, etc. that don't return meaningful data.
 * 
 * @param asyncFn - Async function to execute
 * @param options - Configuration options (without initialData)
 * @returns Object containing state and execute function
 * 
 * @example
 * ```tsx
 * const deleteUser = async (id: string) => {
 *   await api.delete(`/users/${id}`)
 * }
 * 
 * const { isLoading, error, execute } = useAsyncVoid(deleteUser, {
 *   defaultErrorMessage: 'Failed to delete user',
 * })
 * ```
 */
export function useAsyncVoid(
  asyncFn: (...args: unknown[]) => Promise<void>,
  options: Omit<UseAsyncOptions<void>, 'initialData'> = {}
): Omit<UseAsyncResult<void>, 'data' | 'setData'> {
  const result = useAsync<void>(asyncFn, options)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, setData, ...rest } = result
  return rest
}

