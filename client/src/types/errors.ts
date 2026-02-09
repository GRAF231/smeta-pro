/**
 * Error types and interfaces for centralized error handling
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info'

/**
 * Error categories for better error handling and user experience
 */
export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'notFound'
  | 'server'
  | 'timeout'
  | 'unknown'

/**
 * HTTP status code ranges
 */
export type HttpStatusCode = 
  | 400 | 401 | 403 | 404 | 408 | 422 | 500 | 502 | 503 | 504
  | number

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  /** Error message from API */
  message?: string
  /** Error code or type */
  error?: string
  /** HTTP status code */
  status?: HttpStatusCode
  /** Additional error details */
  details?: Record<string, unknown>
  /** Validation errors (for 422 status) */
  errors?: Record<string, string[]>
}

/**
 * Axios-like error structure
 */
export interface AxiosLikeError {
  /** Error message */
  message?: string
  /** Response object */
  response?: {
    /** Response data */
    data?: ApiErrorResponse
    /** HTTP status code */
    status?: HttpStatusCode
    /** Response headers */
    headers?: Record<string, string>
  }
  /** Request configuration */
  request?: unknown
  /** Error code */
  code?: string
}

/**
 * Structured error information
 */
export interface AppError {
  /** User-friendly error message */
  message: string
  /** Error category for handling logic */
  category: ErrorCategory
  /** Error severity level */
  severity: ErrorSeverity
  /** HTTP status code if applicable */
  statusCode?: HttpStatusCode
  /** Original error object */
  originalError?: unknown
  /** Additional error context */
  context?: Record<string, unknown>
  /** API error details if available */
  apiError?: ApiErrorResponse
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Whether to log errors to console */
  logToConsole?: boolean
  /** Whether to show error notifications to user */
  showNotification?: boolean
  /** Custom error handler function */
  onError?: (error: AppError) => void
  /** Function to show toast notification */
  showToast?: (message: string, severity: ErrorSeverity, duration?: number) => void
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

