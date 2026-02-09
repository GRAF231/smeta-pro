/**
 * Hook for EstimatePage event handlers
 * 
 * Composes handlers from specialized hooks for views, sections, and items.
 * Maintains backward compatibility with existing interface.
 */

import { projectsApi } from '../../../services/api'
import type { ProjectWithEstimate, ProjectId, ViewId, ItemId, SectionId } from '../../../types'
import { useViewHandlers } from './useViewHandlers'
import { useSectionHandlers } from './useSectionHandlers'
import { useItemHandlers } from './useItemHandlers'

interface UseEstimateHandlersProps {
  projectId: ProjectId | undefined
  project: ProjectWithEstimate | null
  setProject: (project: ProjectWithEstimate | null) => void
  activeViewId: ViewId | null
  setActiveViewId: (id: ViewId | null) => void
  setError: (error: string) => void
  editingData: { name?: string; unit?: string; quantity?: number; price?: number }
  setEditingItem: (id: ItemId | null) => void
  setEditingData: (data: { name?: string; unit?: string; quantity?: number; price?: number }) => void
  newSectionName: string
  setNewSectionName: (name: string) => void
  setIsAddingSection: (adding: boolean) => void
  setShowAddSection: (show: boolean) => void
  editingSectionName: string
  setEditingSectionId: (id: SectionId | null) => void
  setEditingSectionName: (name: string) => void
  setNewItemSection: (id: SectionId | null) => void
  setIsSyncing: (syncing: boolean) => void
  loadProject: (id: ProjectId) => Promise<void>
}

/**
 * Hook for EstimatePage event handlers
 * 
 * Composes handlers from specialized hooks for better organization.
 * 
 * @param props - Handler dependencies
 * @returns Object with all event handlers
 */
export function useEstimateHandlers(props: UseEstimateHandlersProps) {
  const {
    projectId,
    setIsSyncing,
    loadProject,
  } = props

  const viewHandlers = useViewHandlers({
    projectId: props.projectId,
    project: props.project,
    setProject: props.setProject,
    activeViewId: props.activeViewId,
    setActiveViewId: props.setActiveViewId,
    setError: props.setError,
    loadProject: props.loadProject,
  })

  const sectionHandlers = useSectionHandlers({
    projectId: props.projectId,
    project: props.project,
    setProject: props.setProject,
    activeViewId: props.activeViewId,
    setError: props.setError,
    newSectionName: props.newSectionName,
    setNewSectionName: props.setNewSectionName,
    setIsAddingSection: props.setIsAddingSection,
    setShowAddSection: props.setShowAddSection,
    editingSectionName: props.editingSectionName,
    setEditingSectionId: props.setEditingSectionId,
    setEditingSectionName: props.setEditingSectionName,
    loadProject: props.loadProject,
  })

  const itemHandlers = useItemHandlers({
    projectId: props.projectId,
    project: props.project,
    setProject: props.setProject,
    activeViewId: props.activeViewId,
    setError: props.setError,
    editingData: props.editingData,
    setEditingItem: props.setEditingItem,
    setEditingData: props.setEditingData,
    setNewItemSection: props.setNewItemSection,
    loadProject: props.loadProject,
  })

  /**
   * Handle sync with Google Sheets
   */
  const handleSync = async () => {
    if (!projectId) return
    setIsSyncing(true)
    try {
      await projectsApi.sync(projectId)
      await loadProject(projectId)
    } catch {
      props.setError('Ошибка синхронизации')
    } finally {
      setIsSyncing(false)
    }
  }

  return {
    handleSync,
    ...viewHandlers,
    ...sectionHandlers,
    ...itemHandlers,
  }
}

