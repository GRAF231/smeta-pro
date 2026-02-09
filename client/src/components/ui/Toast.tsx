/**
 * Toast notification component for displaying temporary messages
 */

import { useEffect, useState } from 'react'
import type { ErrorSeverity } from '../../types'

/**
 * Props for Toast component
 */
export interface ToastProps {
  /** Message to display */
  message: string
  /** Severity level determines styling */
  severity?: ErrorSeverity
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
  duration?: number
  /** Callback when toast is dismissed */
  onClose?: () => void
}

/**
 * Toast notification component
 * 
 * Displays a temporary notification message that can be dismissed manually
 * or automatically after a specified duration.
 * 
 * @example
 * ```tsx
 * <Toast
 *   message="Operation completed successfully"
 *   severity="info"
 *   duration={3000}
 *   onClose={() => setShowToast(false)}
 * />
 * ```
 */
export default function Toast({
  message,
  severity = 'error',
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // Wait for fade-out animation
      }, duration)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300) // Wait for fade-out animation
  }

  if (!isVisible && !message) return null

  const severityStyles = {
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 min-w-[300px] max-w-[500px] p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${severityStyles[severity]}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

