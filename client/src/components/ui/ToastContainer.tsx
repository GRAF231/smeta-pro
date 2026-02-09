/**
 * Toast container component for managing multiple toast notifications
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Toast from './Toast'
import type { ErrorSeverity } from '../../types'

/**
 * Toast notification data
 */
export interface ToastData {
  id: string
  message: string
  severity?: ErrorSeverity
  duration?: number
}

/**
 * Toast context type
 */
interface ToastContextType {
  showToast: (message: string, severity?: ErrorSeverity, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * Hook to access toast functions
 * 
 * @example
 * ```tsx
 * const { showError, showInfo } = useToast()
 * 
 * showError('Something went wrong')
 * showInfo('Operation completed')
 * ```
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

/**
 * Props for ToastProvider component
 */
interface ToastProviderProps {
  children: ReactNode
}

/**
 * Toast provider component that manages toast notifications
 * 
 * Should be placed at the root of the application to enable toast notifications
 * throughout the app.
 * 
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback(
    (message: string, severity: ErrorSeverity = 'error', duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, severity, duration }])
    },
    []
  )

  const showError = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, 'error', duration)
    },
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, 'warning', duration)
    },
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, 'info', duration)
    },
    [showToast]
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showError, showWarning, showInfo }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto" style={{ zIndex: 50 + index }}>
            <Toast
              message={toast.message}
              severity={toast.severity}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

