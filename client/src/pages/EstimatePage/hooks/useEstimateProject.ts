/**
 * Hook for managing project loading state
 * 
 * Handles project data loading, syncing, and error states.
 * Provides functionality to load and reload project data.
 * 
 * @param projectId - Project ID from route params
 * @returns Object containing:
 * - `project` - Project data with full estimate (null if not loaded)
 * - `isLoading` - Loading state flag
 * - `isSyncing` - Syncing state flag
 * - `error` - Error message string (empty if no error)
 * - `setProject` - Function to manually set project state
 * - `setIsSyncing` - Function to set syncing state
 * - `setError` - Function to manually set error state
 * - `loadProject` - Function to load/reload project data
 * 
 * @example
 * ```tsx
 * const { project, isLoading, loadProject } = useEstimateProject(projectId)
 * 
 * useEffect(() => {
 *   if (projectId) loadProject(projectId)
 * }, [projectId])
 * ```
 */

import { useState, useEffect } from 'react'
import { projectsApi } from '../../../services/api'
import type { ProjectWithEstimate, ProjectId } from '../../../types'

export interface UseEstimateProjectResult {
  project: ProjectWithEstimate | null
  isLoading: boolean
  isSyncing: boolean
  error: string
  setProject: (project: ProjectWithEstimate | null) => void
  setIsSyncing: (syncing: boolean) => void
  setError: (error: string) => void
  loadProject: (id: ProjectId) => Promise<void>
}

export function useEstimateProject(
  projectId: ProjectId | undefined,
  onProjectLoaded?: (project: ProjectWithEstimate) => void
): UseEstimateProjectResult {
  const [project, setProject] = useState<ProjectWithEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState('')

  /**
   * Load project data
   */
  const loadProject = async (id: ProjectId) => {
    try {
      setIsLoading(true)
      setError('')
      const res = await projectsApi.getOne(id)
      setProject(res.data)
      if (onProjectLoaded) {
        onProjectLoaded(res.data)
      }
    } catch {
      setError('Ошибка загрузки проекта')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId])

  return {
    project,
    isLoading,
    isSyncing,
    error,
    setProject,
    setIsSyncing,
    setError,
    loadProject,
  }
}

