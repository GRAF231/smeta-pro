/**
 * Hook for projects API operations
 */

import { useState, useCallback } from 'react'
import { projectsApi } from '../../services/api'
import type { Project, ProjectWithEstimate, ProjectId } from '../../types'
import { getErrorMessage } from '../../utils/errors'

/**
 * Hook for managing projects list
 * 
 * Provides state management and operations for projects including:
 * - Loading projects list
 * - Creating new projects
 * - Updating existing projects
 * - Deleting projects
 * 
 * @returns Object containing:
 * - `projects` - Array of all projects
 * - `isLoading` - Loading state flag
 * - `error` - Error message string (empty if no error)
 * - `loadProjects` - Function to fetch all projects
 * - `createProject` - Function to create a new project
 * - `updateProject` - Function to update an existing project
 * - `deleteProject` - Function to delete a project
 * - `setError` - Function to manually set error state
 * 
 * @example
 * ```tsx
 * const { projects, isLoading, loadProjects, createProject } = useProjects()
 * 
 * useEffect(() => {
 *   loadProjects()
 * }, [])
 * 
 * const handleCreate = async () => {
 *   try {
 *     await createProject({ title: 'New Project', googleSheetUrl: '...' })
 *     await loadProjects()
 *   } catch (err) {
 *     // Error is automatically set in hook state
 *   }
 * }
 * ```
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.getAll()
      setProjects(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки проектов'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Create a new project
   * @param data - Project data with title and optional Google Sheet URL
   * @returns Promise resolving to the created project
   * @throws Error if creation fails
   */
  const createProject = useCallback(async (data: { title: string; googleSheetUrl?: string }) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.create(data)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка создания проекта'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update an existing project
   * @param id - Project ID to update
   * @param data - Updated project data
   * @returns Promise resolving to the updated project
   * @throws Error if update fails
   */
  const updateProject = useCallback(async (id: ProjectId, data: { title: string; googleSheetUrl?: string }) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.update(id, data)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка обновления проекта'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Delete a project
   * @param id - Project ID to delete
   * @throws Error if deletion fails
   */
  const deleteProject = useCallback(async (id: ProjectId) => {
    setIsLoading(true)
    setError('')
    try {
      await projectsApi.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка удаления проекта'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    setError,
  }
}

/**
 * Hook for managing a single project
 * 
 * Provides state management for a single project including:
 * - Loading project data with full estimate
 * - Syncing project with Google Sheets
 * 
 * @param projectId - Project ID (undefined to disable loading)
 * @returns Object containing:
 * - `project` - Project data with estimate sections and items (null if not loaded)
 * - `isLoading` - Loading state flag
 * - `error` - Error message string (empty if no error)
 * - `loadProject` - Function to reload project data
 * - `syncProject` - Function to sync project with Google Sheets
 * - `setProject` - Function to manually set project state
 * - `setError` - Function to manually set error state
 * 
 * @example
 * ```tsx
 * const { project, isLoading, loadProject, syncProject } = useProject(projectId)
 * 
 * useEffect(() => {
 *   loadProject()
 * }, [projectId])
 * 
 * const handleSync = async () => {
 *   try {
 *     await syncProject()
 *     // Project is automatically reloaded after sync
 *   } catch (err) {
 *     // Error handling
 *   }
 * }
 * ```
 */
export function useProject(projectId: ProjectId | undefined) {
  const [project, setProject] = useState<ProjectWithEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadProject = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.getOne(projectId)
      setProject(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки проекта'))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Sync project with Google Sheets and reload data
   * @throws Error if sync fails
   */
  const syncProject = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      await projectsApi.sync(projectId)
      await loadProject()
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка синхронизации'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId, loadProject])

  return {
    project,
    isLoading,
    error,
    loadProject,
    syncProject,
    setProject,
    setError,
  }
}

