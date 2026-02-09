/**
 * Hook for managing async operation state
 * 
 * Provides a reusable state management pattern for async operations
 * with loading, error, and data states.
 */

import { useState, useCallback } from 'react'

/**
 * State for async operations
 */
export interface AsyncState<T> {
  /** Current data value */
  data: T | null
  /** Loading state flag */
  isLoading: boolean
  /** Error message string (empty if no error) */
  error: string
}

/**
 * Initial async state
 */
const initialAsyncState = <T,>(): AsyncState<T> => ({
  data: null,
  isLoading: false,
  error: '',
})

/**
 * Hook for managing async operation state
 * 
 * Provides state management for async operations with:
 * - Data state (null initially)
 * - Loading state
 * - Error state
 * - Helper functions to update state
 * 
 * @template T - Type of data being managed
 * @returns Object containing state and state setters
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, setData, setLoading, setError, reset } = useAsyncState<User>()
 * 
 * const loadUser = async () => {
 *   setLoading(true)
 *   try {
 *     const user = await fetchUser()
 *     setData(user)
 *   } catch (err) {
 *     setError('Failed to load user')
 *   } finally {
 *     setLoading(false)
 *   }
 * }
 * ```
 */
export function useAsyncState<T>() {
  const [state, setState] = useState<AsyncState<T>>(initialAsyncState<T>())

  /**
   * Set data value
   */
  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, error: '' }))
  }, [])

  /**
   * Set loading state
   */
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])

  /**
   * Set error message
   */
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }))
  }, [])

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState(initialAsyncState<T>())
  }, [])

  /**
   * Update multiple state values at once
   */
  const updateState = useCallback((updates: Partial<AsyncState<T>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  return {
    ...state,
    setData,
    setLoading,
    setError,
    reset,
    updateState,
  }
}

/**
 * Hook for managing async operation state with initial data
 * 
 * Similar to useAsyncState but allows setting initial data value.
 * 
 * @template T - Type of data being managed
 * @param initialData - Initial data value (default: null)
 * @returns Object containing state and state setters
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, setData, setLoading, setError } = useAsyncStateWithData<User[]>([])
 * ```
 */
export function useAsyncStateWithData<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    isLoading: false,
    error: '',
  })

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, error: '' }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }))
  }, [])

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: '',
    })
  }, [initialData])

  const updateState = useCallback((updates: Partial<AsyncState<T>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  return {
    ...state,
    setData,
    setLoading,
    setError,
    reset,
    updateState,
  }
}

