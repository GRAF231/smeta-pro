interface SpinnerProps {
  /** Size variant: default is medium */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export default function Spinner({ size = 'lg', className = '' }: SpinnerProps) {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary-500 ${sizeMap[size]} ${className}`} />
  )
}

/** Full-page centered spinner, used for page loading states */
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )
}

