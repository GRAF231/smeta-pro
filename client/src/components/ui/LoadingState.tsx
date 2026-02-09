import { ReactNode } from 'react'
import Spinner from './Spinner'

export interface LoadingStateProps {
  /** Loading message */
  message?: string
  /** Custom spinner size */
  spinnerSize?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Custom content to show instead of default spinner */
  children?: ReactNode
}

/**
 * Component for displaying loading states
 * 
 * Provides a consistent way to show loading states with:
 * - Default spinner with customizable size
 * - Optional loading message
 * - Support for custom loading content
 * 
 * @example
 * ```tsx
 * // Basic loading state
 * <LoadingState message="Loading data..." />
 * 
 * // Custom spinner size
 * <LoadingState message="Please wait..." spinnerSize="lg" />
 * 
 * // Custom content
 * <LoadingState>
 *   <CustomSpinner />
 *   <p>Custom loading message</p>
 * </LoadingState>
 * ```
 */
export default function LoadingState({
  message = 'Загрузка...',
  spinnerSize = 'lg',
  className = '',
  children,
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {children || <Spinner size={spinnerSize} />}
      {message && (
        <p className="mt-4 text-slate-400 text-sm">{message}</p>
      )}
    </div>
  )
}

/**
 * Full-page loading state component
 */
export function PageLoadingState({
  message = 'Загрузка...',
  spinnerSize = 'lg',
}: Omit<LoadingStateProps, 'className' | 'children'>) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingState message={message} spinnerSize={spinnerSize} />
    </div>
  )
}

