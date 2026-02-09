/**
 * Hook for managing form state
 */

import { useState, useCallback } from 'react'

/**
 * Generic form state management hook
 * 
 * Manages form state including values, touched fields, and validation errors.
 * Provides handlers for updating values, marking fields as touched, and managing errors.
 * 
 * @template T - Type of form values object (must be a record/object)
 * @param initialValues - Initial form values
 * @returns Object containing:
 * - `values` - Current form values
 * - `touched` - Object mapping field names to touched state
 * - `errors` - Object mapping field names to error messages
 * - `setValue` - Function to update a single field value (clears error on change)
 * - `setValues` - Function to update all form values
 * - `setFieldTouched` - Function to mark a field as touched
 * - `setFieldError` - Function to set error for a single field
 * - `setAllErrors` - Function to set all errors at once
 * - `reset` - Function to reset form to initial values
 * - `resetToValues` - Function to reset form to new values
 * 
 * @example
 * ```tsx
 * interface FormData {
 *   email: string
 *   password: string
 * }
 * 
 * const form = useFormState<FormData>({ email: '', password: '' })
 * 
 * const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
 *   form.setValue(e.target.name as keyof FormData, e.target.value)
 * }
 * 
 * const handleBlur = (field: keyof FormData) => {
 *   form.setFieldTouched(field)
 * }
 * ```
 */
export function useFormState<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as string]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name as string]
        return next
      })
    }
  }, [errors])

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const setAllErrors = useCallback((newErrors: Record<string, string>) => {
    setErrors(newErrors)
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setTouched({})
    setErrors({})
  }, [initialValues])

  const resetToValues = useCallback((newValues: T) => {
    setValues(newValues)
    setTouched({})
    setErrors({})
  }, [])

  return {
    values,
    touched,
    errors,
    setValue,
    setValues,
    setFieldTouched,
    setFieldError,
    setAllErrors,
    reset,
    resetToValues,
  }
}

