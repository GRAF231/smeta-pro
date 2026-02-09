import { ReactNode } from 'react'

export interface FormFieldProps {
  /** Field label */
  label: string
  /** Field content (input, select, textarea, etc.) */
  children: ReactNode
  /** Optional hint text below the field */
  hint?: string
  /** Error message to display */
  error?: string
  /** Whether field is required */
  required?: boolean
  /** Additional CSS classes for the container */
  className?: string
  /** HTML id for the field (for label association) */
  htmlFor?: string
}

/**
 * Wrapper component for form fields with label, error, and hint support
 * 
 * Provides consistent form field layout with:
 * - Label with optional required indicator
 * - Error message display (shown below field)
 * - Hint text (shown when no error)
 * - Proper label-input association via htmlFor
 * - Consistent spacing and styling
 * 
 * @example
 * ```tsx
 * // Required field with error
 * <FormField
 *   label="Email"
 *   required
 *   error={errors.email}
 *   htmlFor="email"
 * >
 *   <Input
 *     id="email"
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *   />
 * </FormField>
 * 
 * // Optional field with hint
 * <FormField
 *   label="Description"
 *   hint="This field is optional"
 * >
 *   <textarea className="input-field" />
 * </FormField>
 * ```
 */
export default function FormField({
  label,
  children,
  hint,
  error,
  required = false,
  className = '',
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="label"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  )
}

