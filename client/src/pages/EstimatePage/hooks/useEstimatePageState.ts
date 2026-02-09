/**
 * Hook for managing EstimatePage state
 * 
 * Composes state from specialized hooks for better organization:
 * - Project loading and syncing
 * - Item editing
 * - Section management
 * - View selection
 * 
 * This hook provides a unified interface while keeping concerns separated.
 * 
 * @param projectId - Project ID from route params
 * @returns Combined state and state setters for EstimatePage
 * 
 * @example
 * ```tsx
 * const state = useEstimatePageState(projectId)
 * 
 * // Access project data
 * const { project, isLoading } = state
 * 
 * // Access editing state
 * const { editingItem, editingData } = state
 * ```
 */

import type { ProjectId } from '../../../types'
import { useEstimateProject } from './useEstimateProject'
import { useEstimateEditing } from './useEstimateEditing'
import { useEstimateSections } from './useEstimateSections'
import { useEstimateViews } from './useEstimateViews'

export interface UseEstimatePageStateResult {
  // Project state
  project: ReturnType<typeof useEstimateProject>['project']
  setProject: ReturnType<typeof useEstimateProject>['setProject']
  isLoading: ReturnType<typeof useEstimateProject>['isLoading']
  isSyncing: ReturnType<typeof useEstimateProject>['isSyncing']
  setIsSyncing: ReturnType<typeof useEstimateProject>['setIsSyncing']
  error: ReturnType<typeof useEstimateProject>['error']
  setError: ReturnType<typeof useEstimateProject>['setError']
  loadProject: ReturnType<typeof useEstimateProject>['loadProject']
  
  // Editing state
  editingItem: ReturnType<typeof useEstimateEditing>['editingItem']
  setEditingItem: ReturnType<typeof useEstimateEditing>['setEditingItem']
  editingData: ReturnType<typeof useEstimateEditing>['editingData']
  setEditingData: ReturnType<typeof useEstimateEditing>['setEditingData']
  newItemSection: ReturnType<typeof useEstimateEditing>['newItemSection']
  setNewItemSection: ReturnType<typeof useEstimateEditing>['setNewItemSection']
  
  // Sections state
  showAddSection: ReturnType<typeof useEstimateSections>['showAddSection']
  setShowAddSection: ReturnType<typeof useEstimateSections>['setShowAddSection']
  newSectionName: ReturnType<typeof useEstimateSections>['newSectionName']
  setNewSectionName: ReturnType<typeof useEstimateSections>['setNewSectionName']
  isAddingSection: ReturnType<typeof useEstimateSections>['isAddingSection']
  setIsAddingSection: ReturnType<typeof useEstimateSections>['setIsAddingSection']
  editingSectionId: ReturnType<typeof useEstimateSections>['editingSectionId']
  setEditingSectionId: ReturnType<typeof useEstimateSections>['setEditingSectionId']
  editingSectionName: ReturnType<typeof useEstimateSections>['editingSectionName']
  setEditingSectionName: ReturnType<typeof useEstimateSections>['setEditingSectionName']
  
  // Views state
  activeViewId: ReturnType<typeof useEstimateViews>['activeViewId']
  setActiveViewId: ReturnType<typeof useEstimateViews>['setActiveViewId']
  showVersionModal: ReturnType<typeof useEstimateViews>['showVersionModal']
  setShowVersionModal: ReturnType<typeof useEstimateViews>['setShowVersionModal']
}

export function useEstimatePageState(projectId: ProjectId | undefined): UseEstimatePageStateResult {
  const editingState = useEstimateEditing()
  const sectionsState = useEstimateSections()
  
  const projectState = useEstimateProject(projectId)
  
  const viewsState = useEstimateViews({
    views: projectState.project?.views,
  })

  return {
    // Project state
    project: projectState.project,
    setProject: projectState.setProject,
    isLoading: projectState.isLoading,
    isSyncing: projectState.isSyncing,
    setIsSyncing: projectState.setIsSyncing,
    error: projectState.error,
    setError: projectState.setError,
    loadProject: projectState.loadProject,
    
    // Editing state
    editingItem: editingState.editingItem,
    setEditingItem: editingState.setEditingItem,
    editingData: editingState.editingData,
    setEditingData: editingState.setEditingData,
    newItemSection: editingState.newItemSection,
    setNewItemSection: editingState.setNewItemSection,
    
    // Sections state
    showAddSection: sectionsState.showAddSection,
    setShowAddSection: sectionsState.setShowAddSection,
    newSectionName: sectionsState.newSectionName,
    setNewSectionName: sectionsState.setNewSectionName,
    isAddingSection: sectionsState.isAddingSection,
    setIsAddingSection: sectionsState.setIsAddingSection,
    editingSectionId: sectionsState.editingSectionId,
    setEditingSectionId: sectionsState.setEditingSectionId,
    editingSectionName: sectionsState.editingSectionName,
    setEditingSectionName: sectionsState.setEditingSectionName,
    
    // Views state
    activeViewId: viewsState.activeViewId,
    setActiveViewId: viewsState.setActiveViewId,
    showVersionModal: viewsState.showVersionModal,
    setShowVersionModal: viewsState.setShowVersionModal,
  }
}

