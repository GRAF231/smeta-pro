/**
 * Props for Spinner component
 */
interface SpinnerProps {
  /** Size variant (default: 'lg') */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/**
 * Size mapping for spinner component
 */
const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
} as const

/**
 * Loading spinner component with configurable size
 * 
 * Displays an animated spinning circle for indicating loading states.
 * Provides three size variants (sm, md, lg) for different use cases.
 * 
 * @example
 * ```tsx
 * // Inline spinner
 * {isLoading ? <Spinner size="md" /> : <Content />}
 * 
 * // Different sizes
 * <Spinner size="sm" />  // Small spinner
 * <Spinner size="md" />  // Medium spinner
 * <Spinner size="lg" />  // Large spinner (default)
 * ```
 */
export default function Spinner({ size = 'lg', className = '' }: SpinnerProps) {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary-500 ${sizeMap[size]} ${className}`} />
  )
}

/**
 * Full-page centered spinner component
 * 
 * Displays a large spinner centered vertically and horizontally on the page.
 * Use for initial page loading states or when loading critical data.
 * Provides consistent full-page loading UI across the application.
 * 
 * @example
 * ```tsx
 * // In page component
 * if (isLoading) return <PageSpinner />
 * 
 * // With conditional rendering
 * {isLoading ? (
 *   <PageSpinner />
 * ) : (
 *   <PageContent />
 * )}
 * ```
 */
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )
}

