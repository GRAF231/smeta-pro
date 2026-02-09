/**
 * API hooks - centralized exports
 * 
 * All hooks for interacting with API endpoints are exported here.
 * These hooks provide state management and operations for various API resources.
 * 
 * @example
 * ```tsx
 * import { useProjects, useMaterials, useActs } from '@/hooks/api'
 * 
 * function MyComponent() {
 *   const { projects, isLoading, loadProjects } = useProjects()
 *   const { materials, createMaterial } = useMaterials()
 *   // ...
 * }
 * ```
 */

export { useProjects, useProject } from './useProjects'
export { useMaterials } from './useMaterials'
export { useActs } from './useActs'
export { useEstimateViews } from './useEstimateViews'
export { useVersions } from './useVersions'

