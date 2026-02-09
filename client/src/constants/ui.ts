/**
 * UI-related constants (sizes, delays, limits, etc.)
 */

/**
 * Animation delays (in milliseconds)
 * 
 * Used for CSS transitions and JavaScript animations.
 */
export const ANIMATION_DELAYS = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
} as const satisfies Record<string, number>

/**
 * Form validation limits
 * 
 * Used by validation functions to enforce field constraints.
 */
export const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_URL_LENGTH: 2048,
} as const satisfies Record<string, number>

/**
 * Pagination defaults
 * 
 * Default values for pagination components and API requests.
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const satisfies Record<string, number>

/**
 * File upload limits
 * 
 * Constraints for file uploads including size limits and accepted types.
 */
export const FILE_LIMITS = {
  MAX_FILE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_MB: 5,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const satisfies {
  MAX_FILE_SIZE_MB: number
  MAX_IMAGE_SIZE_MB: number
  ACCEPTED_IMAGE_TYPES: readonly string[]
}

