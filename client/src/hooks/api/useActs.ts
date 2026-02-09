/**
 * Hook for acts API operations
 */

import { useState, useCallback } from 'react'
import { projectsApi } from '../../services/api'
import type { SavedAct, SavedActDetail, ProjectId, ActId } from '../../types'
import { getErrorMessage } from '../../utils/errors'

/**
 * Hook for managing acts (saved acts of completed work)
 * 
 * Provides operations for managing acts including:
 * - Loading acts list
 * - Loading act details
 * - Loading act images
 * - Deleting acts
 * 
 * @param projectId - Project ID (undefined to disable operations)
 * @returns Object containing:
 * - `acts` - Array of saved acts
 * - `selectedAct` - Currently selected act details (null if none)
 * - `images` - Record of act images (logo, stamp, signature)
 * - `isLoading` - Loading state flag
 * - `error` - Error message string (empty if no error)
 * - `loadActs` - Function to load acts list
 * - `loadAct` - Function to load act details
 * - `loadImages` - Function to load act images
 * - `deleteAct` - Function to delete an act
 * - `setSelectedAct` - Function to set selected act
 * - `setError` - Function to manually set error state
 * 
 * @example
 * ```tsx
 * const { acts, isLoading, loadActs, loadAct } = useActs(projectId)
 * 
 * useEffect(() => {
 *   loadActs()
 * }, [projectId])
 * 
 * const handleSelectAct = async (actId: string) => {
 *   await loadAct(actId)
 * }
 * ```
 */
export function useActs(projectId: ProjectId | undefined) {
  const [acts, setActs] = useState<SavedAct[]>([])
  const [selectedAct, setSelectedAct] = useState<SavedActDetail | null>(null)
  const [images, setImages] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  /**
   * Load acts list for the project
   * @throws Error if loading fails
   */
  const loadActs = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.getActs(projectId)
      setActs(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки актов'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Load act details by ID
   * @param actId - Act ID to load
   * @throws Error if loading fails
   */
  const loadAct = useCallback(async (actId: ActId) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.getAct(projectId, actId)
      setSelectedAct(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки акта'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Load act images (logo, stamp, signature)
   * @throws Error if loading fails
   */
  const loadImages = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await projectsApi.getActImages(projectId)
      setImages(res.data)
    } catch (err) {
      // Silently fail for images - they're optional
      console.error('Failed to load act images:', err)
    }
  }, [projectId])

  /**
   * Delete an act
   * @param actId - Act ID to delete
   * @throws Error if deletion fails
   */
  const deleteAct = useCallback(async (actId: ActId) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      await projectsApi.deleteAct(projectId, actId)
      setActs(prev => prev.filter(a => a.id !== actId))
      if (selectedAct?.id === actId) {
        setSelectedAct(null)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка удаления акта'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId, selectedAct])

  return {
    acts,
    selectedAct,
    images,
    isLoading,
    error,
    loadActs,
    loadAct,
    loadImages,
    deleteAct,
    setSelectedAct,
    setError,
  }
}

