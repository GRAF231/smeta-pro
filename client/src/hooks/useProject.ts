import { useState, useEffect, useCallback } from 'react'
import { projectsApi } from '../services/api'
import type { ProjectWithEstimate } from '../types'

interface UseProjectResult {
  project: ProjectWithEstimate | null
  isLoading: boolean
  error: string
  setError: (error: string) => void
  setProject: (project: ProjectWithEstimate | null) => void
  reload: () => Promise<void>
}

/**
 * Hook for loading a project by ID with loading/error state management.
 * Used across EstimatePage, ActPage, ActsPage, ProjectEditor, MaterialsPage.
 */
export function useProject(id: string | undefined): UseProjectResult {
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

