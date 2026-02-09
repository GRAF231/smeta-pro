/**
 * Hook for materials API operations
 */

import { useState, useCallback } from 'react'
import { materialsApi } from '../../services/api'
import type { Material, ProjectId, MaterialId } from '../../types'
import { getErrorMessage } from '../../utils/errors'

/**
 * Hook for managing materials in a project
 * 
 * Provides state management and operations for materials including:
 * - Loading materials list
 * - Parsing materials from URLs
 * - Updating material data
 * - Deleting materials
 * - Refreshing material prices (single or all)
 * 
 * @param projectId - Project ID (undefined to disable operations)
 * @returns Object containing:
 * - `materials` - Array of all materials
 * - `isLoading` - Loading state flag
 * - `error` - Error message string (empty if no error)
 * - `loadMaterials` - Function to fetch all materials
 * - `parseMaterials` - Function to parse materials from URLs
 * - `updateMaterial` - Function to update a material
 * - `deleteMaterial` - Function to delete a material
 * - `refreshAll` - Function to refresh prices for all materials
 * - `refreshOne` - Function to refresh price for a single material
 * - `setMaterials` - Function to manually set materials state
 * - `setError` - Function to manually set error state
 * 
 * @example
 * ```tsx
 * const { materials, isLoading, parseMaterials, refreshAll } = useMaterials(projectId)
 * 
 * useEffect(() => {
 *   loadMaterials()
 * }, [projectId])
 * 
 * const handleParse = async () => {
 *   try {
 *     const newMaterials = await parseMaterials(['https://...'])
 *     // Materials are automatically added to state
 *   } catch (err) {
 *     // Error handling
 *   }
 * }
 * ```
 */
export function useMaterials(projectId: ProjectId | undefined) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadMaterials = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await materialsApi.getAll(projectId)
      setMaterials(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки материалов'))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Parse materials from URLs and add them to the project
   * @param urls - Array of URLs to parse
   * @returns Promise resolving to array of parsed materials
   * @throws Error if parsing fails
   */
  const parseMaterials = useCallback(async (urls: string[]) => {
    if (!projectId) return []
    setIsLoading(true)
    setError('')
    try {
      const res = await materialsApi.parse(projectId, urls)
      setMaterials(prev => [...prev, ...res.data])
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка парсинга ссылок'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Update a material's properties
   * @param materialId - Material ID to update
   * @param data - Partial material data to update
   * @returns Promise resolving to updated material
   * @throws Error if update fails
   */
  const updateMaterial = useCallback(async (materialId: MaterialId, data: Partial<Material>) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await materialsApi.update(projectId, materialId, data)
      setMaterials(prev => prev.map(m => m.id === materialId ? res.data : m))
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка обновления материала'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const deleteMaterial = useCallback(async (materialId: MaterialId) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      await materialsApi.delete(projectId, materialId)
      setMaterials(prev => prev.filter(m => m.id !== materialId))
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка удаления материала'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Refresh prices for all materials in the project
   * @returns Promise resolving to refresh result with updated materials
   * @throws Error if refresh fails
   */
  const refreshAll = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await materialsApi.refreshAll(projectId)
      setMaterials(res.data.materials)
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка актуализации'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Refresh price for a single material
   * @param materialId - Material ID to refresh
   * @returns Promise resolving to updated material
   * @throws Error if refresh fails
   */
  const refreshOne = useCallback(async (materialId: MaterialId) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await materialsApi.refreshOne(projectId, materialId)
      setMaterials(prev => prev.map(m => m.id === materialId ? res.data : m))
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка обновления'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  return {
    materials,
    isLoading,
    error,
    loadMaterials,
    parseMaterials,
    updateMaterial,
    deleteMaterial,
    refreshAll,
    refreshOne,
    setMaterials,
    setError,
  }
}

