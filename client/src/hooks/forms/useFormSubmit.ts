/**
 * Hook for handling form submission with loading and error states
 */

import { useState, useCallback } from 'react'
import { getErrorMessage } from '../../utils/errors'

/**
 * Options for form submission hook
 */
export interface UseFormSubmitOptions<T> {
  onSubmit: (values: T) => Promise<void>
  onSuccess?: () => void
  onError?: (error: string) => void
  validate?: (values: T) => Record<string, string>
}

/**
 * Hook for handling form submission with loading and error states
 * 
 * Manages form submission lifecycle including:
 * - Optional validation before submission
 * - Loading state during submission
 * - Error handling and state management
 * - Success/error callbacks
 * 
 * @template T - Type of form values object
 * @param options - Submission configuration:
 * - `onSubmit` - Async function to submit form data
 * - `onSuccess` - Optional callback called on successful submission
 * - `onError` - Optional callback called on submission error
 * - `validate` - Optional validation function returning errors object
 * @returns Object containing:
 * - `isSubmitting` - Loading state flag during submission
 * - `submitError` - Error message string (empty if no error)
 * - `handleSubmit` - Function to handle form submission
 * - `setSubmitError` - Function to manually set error state
 * 
 * @example
 * ```tsx
 * const { isSubmitting, submitError, handleSubmit } = useFormSubmit({
 *   onSubmit: async (values) => {
 *     await api.createProject(values)
 *   },
 *   onSuccess: () => {
 *     navigate('/dashboard')
 *   },
 *   validate: (values) => {
 *     const errors = {}
 *     if (!values.title) errors.title = 'Title is required'
 *     return errors
 *   },
 * })
 * 
 * const onSubmit = (e: FormEvent) => {
 *   e.preventDefault()
 *   handleSubmit(formValues, setErrors)
 * }
 * ```
 */
export function useFormSubmit<T extends Record<string, any>>(
  options: UseFormSubmitOptions<T>
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const handleSubmit = useCallback(async (values: T, setErrors?: (errors: Record<string, string>) => void) => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Validate if validator provided
      if (options.validate) {
        const errors = options.validate(values)
        if (Object.keys(errors).length > 0) {
          if (setErrors) {
            setErrors(errors)
          }
          setIsSubmitting(false)
          return
        }
      }

      // Submit form
      await options.onSubmit(values)

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess()
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Ошибка отправки формы')
      setSubmitError(errorMessage)
      if (options.onError) {
        options.onError(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [options])

  return {
    isSubmitting,
    submitError,
    handleSubmit,
    setSubmitError,
  }
}

