/**
 * Hook for estimate versions API operations
 */

import { useState, useCallback } from 'react'
import { projectsApi } from '../../services/api'
import type { EstimateVersion, ProjectId, VersionId } from '../../types'
import { getErrorMessage } from '../../utils/errors'

/**
 * Hook for managing estimate versions
 * 
 * Provides operations for managing estimate versions (snapshots) including:
 * - Loading versions list
 * - Creating new versions
 * - Loading version details
 * - Restoring a version (replacing current estimate with version data)
 * 
 * @param projectId - Project ID (undefined to disable operations)
 * @returns Object containing:
 * - `versions` - Array of all versions
 * - `isLoading` - Loading state flag
 * - `error` - Error message string (empty if no error)
 * - `loadVersions` - Function to fetch all versions
 * - `createVersion` - Function to create a new version snapshot
 * - `loadVersion` - Function to load full version data with sections
 * - `restoreVersion` - Function to restore estimate from a version
 * - `setVersions` - Function to manually set versions state
 * - `setError` - Function to manually set error state
 * 
 * @example
 * ```tsx
 * const { versions, createVersion, restoreVersion } = useVersions(projectId)
 * 
 * useEffect(() => {
 *   loadVersions()
 * }, [projectId])
 * 
 * const handleCreateVersion = async () => {
 *   try {
 *     const version = await createVersion('Version 1.0')
 *     // Version created
 *   } catch (err) {
 *     // Error handling
 *   }
 * }
 * 
 * const handleRestore = async (versionId) => {
 *   try {
 *     await restoreVersion(versionId)
 *     // Estimate restored from version
 *   } catch (err) {
 *     // Error handling
 *   }
 * }
 * ```
 */
export function useVersions(projectId: ProjectId | undefined) {
  const [versions, setVersions] = useState<EstimateVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadVersions = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.getVersions(projectId)
      setVersions(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки версий'))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Create a new version snapshot of the current estimate
   * @param name - Optional version name
   * @returns Promise resolving to created version
   * @throws Error if creation fails
   */
  const createVersion = useCallback(async (name?: string) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.createVersion(projectId, name)
      setVersions(prev => [...prev, res.data])
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка создания версии'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Load full version data including sections and items
   * @param versionId - Version ID to load
   * @returns Promise resolving to version data with sections, or null if projectId is undefined
   * @throws Error if loading fails
   */
  const loadVersion = useCallback(async (versionId: VersionId) => {
    if (!projectId) return null
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.getVersion(projectId, versionId)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки версии'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Restore estimate from a version (replaces current estimate data)
   * @param versionId - Version ID to restore from
   * @returns Promise resolving to restore result
   * @throws Error if restoration fails
   */
  const restoreVersion = useCallback(async (versionId: VersionId) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.restoreVersion(projectId, versionId)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка восстановления версии'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  return {
    versions,
    isLoading,
    error,
    loadVersions,
    createVersion,
    loadVersion,
    restoreVersion,
    setVersions,
    setError,
  }
}

