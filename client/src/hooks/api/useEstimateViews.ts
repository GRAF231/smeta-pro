/**
 * Hook for estimate views API operations
 */

import { useState, useCallback } from 'react'
import { projectsApi } from '../../services/api'
import type { ProjectId, ViewId, SectionId, ItemId } from '../../types'
import { getErrorMessage } from '../../utils/errors'

/**
 * Hook for managing estimate views
 * 
 * Provides operations for managing estimate views including:
 * - Creating new views
 * - Updating view settings (name, password)
 * - Duplicating views
 * - Deleting views
 * - Updating view-specific section and item settings
 * 
 * @param projectId - Project ID (undefined to disable operations)
 * @returns Object containing:
 * - `isLoading` - Loading state flag
 * - `error` - Error message string (empty if no error)
 * - `createView` - Function to create a new view
 * - `updateView` - Function to update view settings
 * - `duplicateView` - Function to duplicate an existing view
 * - `deleteView` - Function to delete a view
 * - `updateViewSectionSetting` - Function to update section visibility in a view
 * - `updateViewItemSetting` - Function to update item price/visibility in a view
 * - `setError` - Function to manually set error state
 * 
 * @example
 * ```tsx
 * const { isLoading, createView, updateViewItemSetting } = useEstimateViews(projectId)
 * 
 * const handleCreateView = async () => {
 *   try {
 *     const newView = await createView('Customer View')
 *     // View created successfully
 *   } catch (err) {
 *     // Error handling
 *   }
 * }
 * 
 * const handleUpdatePrice = async (viewId, itemId, price) => {
 *   await updateViewItemSetting(viewId, itemId, { price })
 * }
 * ```
 */
export function useEstimateViews(projectId: ProjectId | undefined) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  /**
   * Create a new estimate view
   * @param name - View name
   * @returns Promise resolving to created view
   * @throws Error if creation fails
   */
  const createView = useCallback(async (name: string) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.createView(projectId, name)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка создания представления'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Update view settings (name and/or password)
   * @param viewId - View ID to update
   * @param data - Partial view data to update
   * @returns Promise resolving to updated view
   * @throws Error if update fails
   */
  const updateView = useCallback(async (viewId: ViewId, data: { name?: string; password?: string }) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.updateView(projectId, viewId, data)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка обновления представления'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const duplicateView = useCallback(async (viewId: ViewId) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.duplicateView(projectId, viewId)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка дублирования представления'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const deleteView = useCallback(async (viewId: ViewId) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      await projectsApi.deleteView(projectId, viewId)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка удаления представления'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const updateViewSectionSetting = useCallback(async (
    viewId: ViewId,
    sectionId: SectionId,
    data: { visible: boolean }
  ) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      await projectsApi.updateViewSectionSetting(projectId, viewId, sectionId, data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка обновления'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Update item-specific settings for a view (price and/or visibility)
   * @param viewId - View ID
   * @param itemId - Item ID
   * @param data - Settings to update (price and/or visible flag)
   * @returns Promise resolving to updated settings with calculated total
   * @throws Error if update fails
   */
  const updateViewItemSetting = useCallback(async (
    viewId: ViewId,
    itemId: ItemId,
    data: { price?: number; visible?: boolean }
  ) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.updateViewItemSetting(projectId, viewId, itemId, data)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка обновления'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const setCustomerView = useCallback(async (viewId: ViewId) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.setCustomerView(projectId, viewId)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка установки сметы для заказчика'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  return {
    isLoading,
    error,
    createView,
    updateView,
    duplicateView,
    deleteView,
    updateViewSectionSetting,
    updateViewItemSetting,
    setCustomerView,
    setError,
  }
}

