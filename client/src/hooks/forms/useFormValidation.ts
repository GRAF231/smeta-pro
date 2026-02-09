/**
 * Hook for form validation
 */

import { useCallback } from 'react'
import {
  validateRequired,
  validateEmail,
  validateLength,
  validatePositiveNumber,
  type ValidationResult,
} from '../../utils/validation'

/**
 * Validation rules type
 */
export type ValidationRule<T> = {
  name: keyof T
  validator: (value: any, values: T) => ValidationResult
}

/**
 * Hook for form validation with configurable rules
 * 
 * Provides validation functions that can validate entire form or individual fields
 * based on provided validation rules.
 * 
 * @template T - Type of form values object
 * @param rules - Array of validation rules, each defining a field and its validator
 * @returns Object containing:
 * - `validate` - Function to validate all fields, returns errors object
 * - `validateField` - Function to validate a single field, returns error string or undefined
 * 
 * @example
 * ```tsx
 * interface FormData {
 *   email: string
 *   password: string
 * }
 * 
 * const rules = [
 *   createValidationRules.required<FormData>('email', 'Email'),
 *   createValidationRules.email<FormData>('email'),
 *   createValidationRules.required<FormData>('password', 'Password'),
 *   createValidationRules.length<FormData>('password', 6, 50, 'Password'),
 * ]
 * 
 * const { validate, validateField } = useFormValidation<FormData>(rules)
 * 
 * const errors = validate(formValues)
 * const emailError = validateField('email', formValues.email, formValues)
 * ```
 */
export function useFormValidation<T extends Record<string, any>>(
  rules: ValidationRule<T>[]
) {
  const validate = useCallback((values: T): Record<string, string> => {
    const errors: Record<string, string> = {}

    for (const rule of rules) {
      const value = values[rule.name]
      const result = rule.validator(value, values)
      if (!result.isValid && result.error) {
        errors[rule.name as string] = result.error
      }
    }

    return errors
  }, [rules])

  const validateField = useCallback((name: keyof T, value: any, values: T): string | undefined => {
    const rule = rules.find(r => r.name === name)
    if (!rule) return undefined

    const result = rule.validator(value, values)
    return result.isValid ? undefined : result.error
  }, [rules])

  return {
    validate,
    validateField,
  }
}

/**
 * Factory functions for creating common validation rules
 * 
 * Provides pre-configured validators for common validation scenarios:
 * - Required fields
 * - Email format
 * - String length
 * - Positive numbers
 * 
 * @example
 * ```tsx
 * const rules = [
 *   createValidationRules.required<FormData>('name', 'Name'),
 *   createValidationRules.email<FormData>('email'),
 *   createValidationRules.length<FormData>('description', 10, 500, 'Description'),
 * ]
 * ```
 */
export const createValidationRules = {
  required: <T,>(name: keyof T, fieldName?: string): ValidationRule<T> => ({
    name,
    validator: (value: any) => validateRequired(value, fieldName),
  }),

  email: <T,>(name: keyof T): ValidationRule<T> => ({
    name,
    validator: (value: any) => {
      if (!value) return { isValid: true }
      return validateEmail(value)
        ? { isValid: true }
        : { isValid: false, error: 'Некорректный email адрес' }
    },
  }),

  length: <T,>(name: keyof T, min: number, max: number, fieldName?: string): ValidationRule<T> => ({
    name,
    validator: (value: any) => validateLength(value, min, max, fieldName),
  }),

  positiveNumber: <T,>(name: keyof T, fieldName?: string): ValidationRule<T> => ({
    name,
    validator: (value: any) => validatePositiveNumber(value, fieldName),
  }),
}

