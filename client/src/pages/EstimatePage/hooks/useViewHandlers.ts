import { projectsApi } from '../../../services/api'
import type { ProjectWithEstimate, ProjectId, ViewId } from '../../../types'
import { asViewId } from '../../../types'

interface UseViewHandlersProps {
  projectId: ProjectId | undefined
  project: ProjectWithEstimate | null
  setProject: (project: ProjectWithEstimate | null) => void
  activeViewId: ViewId | null
  setActiveViewId: (id: ViewId | null) => void
  setError: (error: string) => void
  loadProject: (id: ProjectId) => Promise<void>
}

/**
 * Hook for view-related handlers (add, duplicate, delete)
 * 
 * @param props - Handler dependencies
 * @returns Object with view handlers
 */
export function useViewHandlers({
  projectId,
  project,
  setProject,
  activeViewId,
  setActiveViewId,
  setError,
  loadProject,
}: UseViewHandlersProps) {
  /**
   * Handle adding a new view
   */
  const handleAddView = async (name: string) => {
    if (!projectId || !project) return
    try {
      const res = await projectsApi.createView(projectId, name)
      setProject({ ...project, views: [...project.views, res.data] })
      setActiveViewId(asViewId(res.data.id))
      await loadProject(projectId)
    } catch {
      setError('Ошибка создания представления')
    }
  }

  /**
   * Handle duplicating a view
   */
  const handleDuplicateView = async (viewId: ViewId) => {
    if (!projectId || !project) return
    try {
      const res = await projectsApi.duplicateView(projectId, viewId)
      setProject({ ...project, views: [...project.views, res.data] })
      setActiveViewId(asViewId(res.data.id))
      await loadProject(projectId)
    } catch {
      setError('Ошибка дублирования представления')
    }
  }

  /**
   * Handle deleting a view
   */
  const handleDeleteView = async (viewId: ViewId) => {
    if (!projectId || !project) return
    const view = project.views.find(v => v.id === viewId)
    if (!view) return
    if (project.views.length <= 1) {
      setError('Нельзя удалить последнее представление')
      return
    }
    if (!confirm(`Удалить представление "${view.name}"?`)) return
    try {
      await projectsApi.deleteView(projectId, viewId)
      const remaining = project.views.filter(v => v.id !== viewId)
      setProject({ ...project, views: remaining })
      if (activeViewId === viewId) setActiveViewId(remaining[0] ? asViewId(remaining[0].id) : null)
    } catch {
      setError('Ошибка удаления представления')
    }
  }

  return {
    handleAddView,
    handleDuplicateView,
    handleDeleteView,
  }
}

