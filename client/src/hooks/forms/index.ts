/**
 * Form hooks - centralized exports
 * 
 * All hooks for form management are exported here.
 * These hooks provide state management, validation, and submission handling for forms.
 * 
 * @example
 * ```tsx
 * import { useFormState, useFormSubmit, useFormValidation } from '@/hooks/forms'
 * 
 * function MyForm() {
 *   const form = useFormState({ email: '', password: '' })
 *   const { isSubmitting, handleSubmit } = useFormSubmit({
 *     onSubmit: async (values) => {
 *       await api.login(values)
 *     },
 *   })
 *   // ...
 * }
 * ```
 */

export { useFormState } from './useFormState'
export { useFormSubmit } from './useFormSubmit'
export type { UseFormSubmitOptions } from './useFormSubmit'
export { useFormValidation, createValidationRules } from './useFormValidation'
export type { ValidationRule } from './useFormValidation'

