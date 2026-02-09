/**
 * Central type exports
 * 
 * All types are organized by domain and re-exported here for convenient importing.
 * This barrel export provides a single entry point for all type definitions used across the application.
 * 
 * Types are grouped by domain:
 * - Common: Branded ID types and helper functions
 * - Authentication: User and role types
 * - Projects: Project-related types
 * - Estimates: Estimate views, sections, items, and versions
 * - Materials: Material/product types
 * - Acts: Act of completed work types
 * - Errors: Error handling types
 * 
 * @example
 * ```tsx
 * // Import multiple types from central location
 * import type {
 *   Project,
 *   ProjectId,
 *   EstimateItem,
 *   Material,
 *   User,
 * } from '@/types'
 * 
 * // Import helper functions for branded types
 * import { asProjectId, asViewId } from '@/types'
 * 
 * // Use in component
 * function MyComponent({ projectId }: { projectId: string }) {
 *   const id = asProjectId(projectId)
 *   // Type-safe ID usage
 * }
 * ```
 */

// ============================================================================
// Common Types (Branded IDs)
// ============================================================================
/**
 * Branded ID types provide type safety by preventing mixing different ID types.
 * Use helper functions (asProjectId, etc.) to convert strings to branded types.
 * 
 * @example
 * ```tsx
 * import { ProjectId, asProjectId } from '@/types'
 * 
 * function loadProject(id: string) {
 *   const projectId: ProjectId = asProjectId(id)
 *   // Now projectId is type-safe and cannot be mixed with other ID types
 * }
 * ```
 */
export type {
  ProjectId,
  ViewId,
  SectionId,
  ItemId,
  MaterialId,
  VersionId,
  ActId,
  UserId,
} from './common'

/**
 * Helper functions to create branded ID types from strings.
 * These functions ensure type safety when working with IDs.
 * 
 * @example
 * ```tsx
 * import { asProjectId, asViewId } from '@/types'
 * 
 * const projectId = asProjectId('123')
 * const viewId = asViewId('456')
 * // TypeScript will prevent: projectId = viewId (type error)
 * ```
 */
export {
  asProjectId,
  asViewId,
  asSectionId,
  asItemId,
  asMaterialId,
  asVersionId,
  asActId,
  asUserId,
} from './common'

// ============================================================================
// Authentication Types
// ============================================================================
/**
 * Authentication and user-related types.
 * 
 * @example
 * ```tsx
 * import type { User, UserRole } from '@/types'
 * 
 * function checkPermission(user: User, requiredRole: UserRole) {
 *   return user.role === requiredRole
 * }
 * ```
 */
export type { User, UserRole } from './auth'

// ============================================================================
// Project Types
// ============================================================================
/**
 * Project-related types.
 * 
 * - `Project`: Basic project with views (no estimate data)
 * - `ProjectWithEstimate`: Full project with sections and items
 * 
 * @example
 * ```tsx
 * import type { Project, ProjectWithEstimate } from '@/types'
 * 
 * // Use Project for lists (lighter)
 * const projects: Project[] = await loadProjects()
 * 
 * // Use ProjectWithEstimate for editing (full data)
 * const project: ProjectWithEstimate = await loadProjectWithEstimate(id)
 * ```
 */
export type { Project, ProjectWithEstimate } from './projects'

// ============================================================================
// Estimate Types
// ============================================================================
/**
 * Estimate-related types for views, sections, items, and versions.
 * 
 * Core types:
 * - `EstimateView`: Customizable view configuration
 * - `EstimateSection`: Group of items (e.g., "Подготовительные работы")
 * - `EstimateItem`: Single line item with quantity, unit, price
 * - `EstimateVersion`: Snapshot of estimate at a point in time
 * 
 * View-specific types:
 * - `ViewItemSettings`: Per-view price and visibility for items
 * - `ViewSectionSettings`: Per-view visibility for sections
 * 
 * Public types (for customer/master views):
 * - `EstimateData`: Simplified estimate structure for public viewing
 * - `PublicSection`, `PublicViewItem`: Public-facing section and item types
 * 
 * @example
 * ```tsx
 * import type {
 *   EstimateView,
 *   EstimateSection,
 *   EstimateItem,
 *   ViewItemSettings,
 * } from '@/types'
 * 
 * function calculateViewTotal(
 *   section: EstimateSection,
 *   viewId: string
 * ): number {
 *   return section.items.reduce((sum, item) => {
 *     const settings: ViewItemSettings = item.viewSettings[viewId]
 *     return sum + (settings.visible ? settings.total : 0)
 *   }, 0)
 * }
 * ```
 */
export type {
  EstimateView,
  ViewItemSettings,
  ViewSectionSettings,
  EstimateItem,
  EstimateSection,
  EstimateVersion,
  EstimateVersionView,
  EstimateVersionWithSections,
  EstimateData,
  PublicSection,
  PublicViewItem,
  Section,
  ViewItem,
} from './estimates'

// ============================================================================
// Act Types
// ============================================================================
/**
 * Act of completed work (Акт выполненных работ) types.
 * 
 * - `SavedAct`: Basic act information (for lists)
 * - `SavedActDetail`: Full act with all items and details
 * - `SavedActItem`: Single item in an act
 * - `UsedItemInfo`: Information about where an estimate item was used
 * - `UsedItemsMap`: Map tracking item usage across acts
 * 
 * @example
 * ```tsx
 * import type { SavedAct, SavedActDetail, UsedItemsMap } from '@/types'
 * 
 * function getActTotal(act: SavedActDetail): number {
 *   return act.items.reduce((sum, item) => sum + item.total, 0)
 * }
 * 
 * function checkItemUsed(
 *   itemId: string,
 *   usedItems: UsedItemsMap
 * ): boolean {
 *   return (usedItems[itemId]?.length ?? 0) > 0
 * }
 * ```
 */
export type {
  SavedAct,
  SavedActDetail,
  SavedActItem,
  UsedItemInfo,
  UsedItemsMap,
} from './acts'

// ============================================================================
// Material Types
// ============================================================================
/**
 * Material/product types.
 * 
 * - `Material`: Material entity with pricing and metadata
 * - `MaterialRefreshResult`: Result of refreshing material prices
 * 
 * @example
 * ```tsx
 * import type { Material, MaterialRefreshResult } from '@/types'
 * 
 * function calculateMaterialsTotal(materials: Material[]): number {
 *   return materials.reduce((sum, m) => sum + m.total, 0)
 * }
 * 
 * async function refreshPrices(): Promise<MaterialRefreshResult> {
 *   return await materialsApi.refreshAll()
 * }
 * ```
 */
export type {
  Material,
  MaterialRefreshResult,
} from './materials'

// ============================================================================
// Error Types
// ============================================================================
/**
 * Error handling types for centralized error management.
 * 
 * Core types:
 * - `AppError`: Structured error information
 * - `ErrorCategory`: Error categories (network, auth, validation, etc.)
 * - `ErrorSeverity`: Error severity levels (error, warning, info)
 * 
 * API error types:
 * - `ApiErrorResponse`: Standard API error response structure
 * - `AxiosLikeError`: Axios-compatible error structure
 * - `HttpStatusCode`: HTTP status code types
 * 
 * Configuration types:
 * - `ErrorHandlerConfig`: Error handler configuration options
 * - `ErrorBoundaryState`: React error boundary state
 * 
 * @example
 * ```tsx
 * import type { AppError, ErrorCategory, ErrorSeverity } from '@/types'
 * 
 * function handleError(error: unknown): AppError {
 *   return {
 *     message: 'An error occurred',
 *     category: 'network',
 *     severity: 'error',
 *     originalError: error,
 *   }
 * }
 * ```
 */
export type {
  ErrorSeverity,
  ErrorCategory,
  AppError,
  ErrorHandlerConfig,
  ErrorBoundaryState,
  ApiErrorResponse,
  AxiosLikeError,
  HttpStatusCode,
} from './errors'
