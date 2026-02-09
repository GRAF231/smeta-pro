import { SelectHTMLAttributes, forwardRef } from 'react'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether select has error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Options for the select */
  options: SelectOption[]
  /** Placeholder text when no option is selected */
  placeholder?: string
}

/**
 * Reusable select component with consistent styling
 * 
 * Provides a styled select dropdown with:
 * - Size variants (sm, md, lg)
 * - Error state with error message display
 * - Custom dropdown arrow icon
 * - Support for disabled options
 * - Placeholder option support
 * - Full support for all standard HTML select attributes
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Select
 *   value={selectedValue}
 *   onChange={(e) => setSelectedValue(e.target.value)}
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *     { value: '3', label: 'Option 3', disabled: true },
 *   ]}
 *   placeholder="Choose an option"
 * />
 * 
 * // With error state
 * <Select
 *   value={value}
 *   onChange={handleChange}
 *   options={options}
 *   error={hasError}
 *   errorMessage="Please select an option"
 * />
 * ```
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ size = 'md', error = false, errorMessage, options, placeholder, className = '', ...props }, ref) => {
    const baseClasses = 'w-full bg-slate-800/70 border rounded-xl text-slate-100 focus:outline-none transition-all duration-200 appearance-none cursor-pointer'
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-3',
      lg: 'px-5 py-4 text-lg',
    }
    
    const stateClasses = error
      ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/50 focus:border-red-500'
      : 'border-slate-600/50 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500'
    
    return (
      <div className="w-full relative">
        <select
          ref={ref}
          className={`${baseClasses} ${sizeClasses[size]} ${stateClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-slate-800 text-slate-100"
            >
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && errorMessage && (
          <p className="mt-1 text-sm text-red-400">{errorMessage}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select

