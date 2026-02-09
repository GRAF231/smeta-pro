import { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether input has error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
}

/**
 * Reusable input component with consistent styling
 * 
 * Provides a styled input field with:
 * - Size variants (sm, md, lg)
 * - Error state with error message display
 * - Consistent focus states and transitions
 * - Full support for all standard HTML input attributes
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Input
 *   type="text"
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   placeholder="Enter text"
 * />
 * 
 * // With error state
 * <Input
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={hasError}
 *   errorMessage="Invalid email address"
 * />
 * 
 * // Different sizes
 * <Input size="sm" placeholder="Small input" />
 * <Input size="md" placeholder="Medium input" />
 * <Input size="lg" placeholder="Large input" />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = 'md', error = false, errorMessage, className = '', ...props }, ref) => {
    const baseClasses = 'w-full bg-slate-800/70 border rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all duration-200'
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-3',
      lg: 'px-5 py-4 text-lg',
    }
    
    const stateClasses = error
      ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/50 focus:border-red-500'
      : 'border-slate-600/50 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500'
    
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`${baseClasses} ${sizeClasses[size]} ${stateClasses} ${className}`}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-sm text-red-400">{errorMessage}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

