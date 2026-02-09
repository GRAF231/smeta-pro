/**
 * Common types and branded types for IDs
 * Branded types help prevent mixing different ID types and improve type safety
 */

/**
 * Branded type for Project ID
 */
export type ProjectId = string & { readonly __brand: 'ProjectId' }

/**
 * Branded type for View ID
 */
export type ViewId = string & { readonly __brand: 'ViewId' }

/**
 * Branded type for Section ID
 */
export type SectionId = string & { readonly __brand: 'SectionId' }

/**
 * Branded type for Item ID
 */
export type ItemId = string & { readonly __brand: 'ItemId' }

/**
 * Branded type for Material ID
 */
export type MaterialId = string & { readonly __brand: 'MaterialId' }

/**
 * Branded type for Version ID
 */
export type VersionId = string & { readonly __brand: 'VersionId' }

/**
 * Branded type for Act ID
 */
export type ActId = string & { readonly __brand: 'ActId' }

/**
 * Branded type for User ID
 */
export type UserId = string & { readonly __brand: 'UserId' }

/**
 * Helper function to create a ProjectId from a string
 * @param id - String ID to convert
 * @returns ProjectId branded type
 */
export function asProjectId(id: string): ProjectId {
  return id as ProjectId
}

/**
 * Helper function to create a ViewId from a string
 * @param id - String ID to convert
 * @returns ViewId branded type
 */
export function asViewId(id: string): ViewId {
  return id as ViewId
}

/**
 * Helper function to create a SectionId from a string
 * @param id - String ID to convert
 * @returns SectionId branded type
 */
export function asSectionId(id: string): SectionId {
  return id as SectionId
}

/**
 * Helper function to create an ItemId from a string
 * @param id - String ID to convert
 * @returns ItemId branded type
 */
export function asItemId(id: string): ItemId {
  return id as ItemId
}

/**
 * Helper function to create a MaterialId from a string
 * @param id - String ID to convert
 * @returns MaterialId branded type
 */
export function asMaterialId(id: string): MaterialId {
  return id as MaterialId
}

/**
 * Helper function to create a VersionId from a string
 * @param id - String ID to convert
 * @returns VersionId branded type
 */
export function asVersionId(id: string): VersionId {
  return id as VersionId
}

/**
 * Helper function to create an ActId from a string
 * @param id - String ID to convert
 * @returns ActId branded type
 */
export function asActId(id: string): ActId {
  return id as ActId
}

/**
 * Helper function to create a UserId from a string
 * @param id - String ID to convert
 * @returns UserId branded type
 */
export function asUserId(id: string): UserId {
  return id as UserId
}

