import { useState, useEffect, useCallback } from 'react'
import { projectsApi } from '../services/api'
import type { ProjectWithEstimate, ProjectId } from '../types'

interface UseProjectResult {
  project: ProjectWithEstimate | null
  isLoading: boolean
  error: string
  setError: (error: string) => void
  setProject: (project: ProjectWithEstimate | null) => void
  reload: () => Promise<void>
}

/**
 * Hook for loading a project by ID with loading/error state management
 * 
 * Automatically loads project data when ID changes. Used across multiple pages:
 * EstimatePage, ActPage, ActsPage, ProjectEditor, MaterialsPage.
 * 
 * @param id - Project ID (undefined to disable loading)
 * @returns Object containing:
 * - `project` - Project data with full estimate (null if not loaded or loading)
 * - `isLoading` - Loading state flag
 * - `error` - Error message string (empty if no error)
 * - `setError` - Function to manually set error state
 * - `setProject` - Function to manually set project state
 * - `reload` - Function to reload project data
 * 
 * @example
 * ```tsx
 * const { project, isLoading, error, reload } = useProject(projectId)
 * 
 * if (isLoading) return <Spinner />
 * if (error) return <ErrorAlert message={error} />
 * if (!project) return <NotFound />
 * 
 * // Use project data
 * return <div>{project.title}</div>
 * ```
 */
export function useProject(id: ProjectId | undefined): UseProjectResult {
  const [project, setProject] = useState<ProjectWithEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!id) return
    try {
      const res = await projectsApi.getOne(id)
      setProject(res.data)
    } catch {
      setError('Ошибка загрузки проекта')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      reload()
    }
  }, [id, reload])

  return { project, isLoading, error, setError, setProject, reload }
}

