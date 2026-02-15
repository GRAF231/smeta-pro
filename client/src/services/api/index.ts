/**
 * API services - centralized exports
 * 
 * Re-exports all API clients and base instance for convenient importing.
 * 
 * @example
 * ```tsx
 * import { projectsApi, materialsApi, authApi, api } from '@/services/api'
 * ```
 */

// Base API instance (for direct access if needed)
export { api } from './base'

// API clients
export { projectsApi } from './projects'
export { materialsApi } from './materials'
export { authApi } from './auth'
export { yookassaApi } from './yookassa'

