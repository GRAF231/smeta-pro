/**
 * Utilities for converting URL params to branded types
 * 
 * These functions safely convert string params from URL routing (useParams)
 * into branded types for type-safe usage throughout the application.
 */

import type {
  ProjectId,
  ViewId,
  SectionId,
  ItemId,
  MaterialId,
  VersionId,
  ActId,
  UserId,
} from '../types'
import {
  asProjectId,
  asViewId,
  asSectionId,
  asItemId,
  asMaterialId,
  asVersionId,
  asActId,
  asUserId,
} from '../types'

/**
 * Extract ProjectId from URL params
 * 
 * @param params - URL params object (typically from useParams)
 * @param paramName - Name of the param (default: 'id')
 * @returns ProjectId or undefined if param is missing
 * 
 * @example
 * ```tsx
 * const { id } = useParams<{ id: string }>()
 * const projectId = getProjectIdFromParams({ id })
 * ```
 */
export function getProjectIdFromParams(
  params: Record<string, string | undefined>,
  paramName: string = 'id'
): ProjectId | undefined {
  const value = params[paramName]
  return value ? asProjectId(value) : undefined
}

/**
 * Extract ViewId from URL params
 * 
 * @param params - URL params object
 * @param paramName - Name of the param (default: 'viewId')
 * @returns ViewId or undefined if param is missing
 */
export function getViewIdFromParams(
  params: Record<string, string | undefined>,
  paramName: string = 'viewId'
): ViewId | undefined {
  const value = params[paramName]
  return value ? asViewId(value) : undefined
}

/**
 * Extract SectionId from URL params
 * 
 * @param params - URL params object
 * @param paramName - Name of the param (default: 'sectionId')
 * @returns SectionId or undefined if param is missing
 */
export function getSectionIdFromParams(
  params: Record<string, string | undefined>,
  paramName: string = 'sectionId'
): SectionId | undefined {
  const value = params[paramName]
  return value ? asSectionId(value) : undefined
}

/**
 * Extract ItemId from URL params
 * 
 * @param params - URL params object
 * @param paramName - Name of the param (default: 'itemId')
 * @returns ItemId or undefined if param is missing
 */
export function getItemIdFromParams(
  params: Record<string, string | undefined>,
  paramName: string = 'itemId'
): ItemId | undefined {
  const value = params[paramName]
  return value ? asItemId(value) : undefined
}

/**
 * Extract MaterialId from URL params
 * 
 * @param params - URL params object
 * @param paramName - Name of the param (default: 'materialId')
 * @returns MaterialId or undefined if param is missing
 */
export function getMaterialIdFromParams(
  params: Record<string, string | undefined>,
  paramName: string = 'materialId'
): MaterialId | undefined {
  const value = params[paramName]
  return value ? asMaterialId(value) : undefined
}

/**
 * Extract VersionId from URL params
 * 
 * @param params - URL params object
 * @param paramName - Name of the param (default: 'versionId')
 * @returns VersionId or undefined if param is missing
 */
export function getVersionIdFromParams(
  params: Record<string, string | undefined>,
  paramName: string = 'versionId'
): VersionId | undefined {
  const value = params[paramName]
  return value ? asVersionId(value) : undefined
}

/**
 * Extract ActId from URL params
 * 
 * @param params - URL params object
 * @param paramName - Name of the param (default: 'actId' or 'id')
 * @returns ActId or undefined if param is missing
 */
export function getActIdFromParams(
  params: Record<string, string | undefined>,
  paramName: string = 'id'
): ActId | undefined {
  const value = params[paramName]
  return value ? asActId(value) : undefined
}

/**
 * Extract UserId from URL params
 * 
 * @param params - URL params object
 * @param paramName - Name of the param (default: 'userId')
 * @returns UserId or undefined if param is missing
 */
export function getUserIdFromParams(
  params: Record<string, string | undefined>,
  paramName: string = 'userId'
): UserId | undefined {
  const value = params[paramName]
  return value ? asUserId(value) : undefined
}

