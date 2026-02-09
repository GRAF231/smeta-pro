/**
 * API configuration constants
 */

/**
 * API base URL
 */
export const API_BASE_URL = '/api'

/**
 * Request timeout values (in milliseconds)
 * 
 * Used for API calls that may take longer than default timeout.
 */
export const API_TIMEOUTS = {
  DEFAULT: 30000,
  PDF_GENERATION: 360000, // 6 minutes
  MATERIALS_PARSE: 300000, // 5 minutes
  MATERIALS_REFRESH_ALL: 300000, // 5 minutes
  MATERIALS_REFRESH_ONE: 60000, // 1 minute
} as const satisfies Record<string, number>

/**
 * HTTP status codes used in error handling
 */
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const satisfies Record<string, number>

