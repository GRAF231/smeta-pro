/**
 * Hook for managing materials operations
 * 
 * Handles loading, parsing, refreshing, updating, and deleting materials.
 */

import { useState, useEffect } from 'react'
import { materialsApi } from '../../../services/api'
import type { Material, ProjectId, MaterialId } from '../../../types'

/**
 * Hook for managing materials operations
 * 
 * @param projectId - Project ID
 * @returns Materials state and handlers
 */
export function useMaterials(projectId: ProjectId | undefined) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  /**
   * Load materials for project
   */
  const loadMaterials = async (projectIdParam: ProjectId) => {
    try {
      const res = await materialsApi.getAll(projectIdParam)
      setMaterials(res.data)
    } catch {
      setError('Ошибка загрузки материалов')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) loadMaterials(projectId)
  }, [projectId])

  /**
   * Parse URLs and add materials
   */
  const parseUrls = async (urls: string[]) => {
    if (!projectId) return
    try {
      const res = await materialsApi.parse(projectId, urls)
      setMaterials(prev => [...prev, ...res.data])
      return res.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка парсинга ссылок'
      setError(errorMessage)
      throw err
    }
  }

  /**
   * Refresh all materials
   */
  const refreshAll = async () => {
    if (!projectId) return
    try {
      const res = await materialsApi.refreshAll(projectId)
      setMaterials(res.data.materials)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка актуализации'
      setError(errorMessage)
      throw err
    }
  }

  /**
   * Refresh single material
   */
  const refreshOne = async (materialId: MaterialId) => {
    if (!projectId) return
    try {
      const res = await materialsApi.refreshOne(projectId, materialId)
      setMaterials(prev => prev.map(m => (m.id === materialId ? res.data : m)))
      return res.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка обновления'
      setError(errorMessage)
      throw err
    }
  }

  /**
   * Update material
   */
  const updateMaterial = async (materialId: MaterialId, data: Partial<Material>) => {
    if (!projectId) return
    try {
      const res = await materialsApi.update(projectId, materialId, data)
      setMaterials(prev => prev.map(m => (m.id === materialId ? res.data : m)))
      return res.data
    } catch {
      setError('Ошибка сохранения')
      throw new Error('Ошибка сохранения')
    }
  }

  /**
   * Delete material
   */
  const deleteMaterial = async (materialId: MaterialId) => {
    if (!projectId) return
    try {
      await materialsApi.delete(projectId, materialId)
      setMaterials(prev => prev.filter(m => m.id !== materialId))
    } catch {
      setError('Ошибка удаления')
      throw new Error('Ошибка удаления')
    }
  }

  return {
    materials,
    isLoading,
    error,
    setError,
    loadMaterials,
    parseUrls,
    refreshAll,
    refreshOne,
    updateMaterial,
    deleteMaterial,
  }
}

