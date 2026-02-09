/**
 * localStorage key constants
 * 
 * Centralized keys for localStorage to avoid typos and ensure consistency.
 * Includes both static keys and key factory functions.
 */
export const STORAGE_KEYS = {
  /** Authentication token storage key */
  TOKEN: 'token',
  /**
   * Generate storage key for act configuration
   * @param projectId - Project ID
   * @returns Storage key string
   */
  ACT_CONFIG: (projectId: string) => `act-config-${projectId}`,
  /**
   * Generate storage key for KP (коммерческое предложение) configuration
   * @param projectId - Project ID
   * @returns Storage key string
   */
  KP_CONFIG: (projectId: string) => `kp-config-${projectId}`,
} as const

