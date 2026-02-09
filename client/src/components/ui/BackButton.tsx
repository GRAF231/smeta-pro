import { useNavigate } from 'react-router-dom'
import { IconBack } from './Icons'

/**
 * Props for BackButton component
 */
interface BackButtonProps {
  /** Route path to navigate to */
  to: string
  /** Button label text */
  label: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Back navigation button component
 * 
 * Displays a button with back icon that navigates to specified route.
 * Uses React Router's navigate function for client-side navigation.
 * Provides consistent back navigation UI across the application.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <BackButton to="/dashboard" label="Back to Dashboard" />
 * 
 * // With custom styling
 * <BackButton
 *   to="/projects"
 *   label="Back to Projects"
 *   className="mb-6"
 * />
 * ```
 */
export default function BackButton({ to, label, className = '' }: BackButtonProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(to)}
      className={`text-slate-400 hover:text-white mb-2 flex items-center gap-1 ${className}`}
    >
      <IconBack className="w-4 h-4" />
      {label}
    </button>
  )
}

