/**
 * Props for ErrorAlert component
 */
interface ErrorAlertProps {
  /** Error message to display */
  message: string
  /** Optional callback function called when close button is clicked */
  onClose?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Error alert component for displaying error messages
 * 
 * Displays error message in a styled alert box with:
 * - Red-themed error styling
 * - Optional close button
 * - Automatic hiding when message is empty
 * - Consistent error appearance across the app
 * 
 * @example
 * ```tsx
 * // Basic error alert
 * <ErrorAlert message={error} />
 * 
 * // With close button
 * <ErrorAlert
 *   message={error}
 *   onClose={() => setError('')}
 *   className="mb-4"
 * />
 * ```
 */
export default function ErrorAlert({ message, onClose, className = '' }: ErrorAlertProps) {
  if (!message) return null

  return (
    <div className={`mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm ${className}`}>
      {message}
      {onClose && (
        <button onClick={onClose} className="ml-4 text-red-300 hover:text-red-200">✕</button>
      )}
    </div>
  )
}

