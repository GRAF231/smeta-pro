/**
 * Hook for managing act images
 * 
 * Handles uploading, loading, and deleting images for the act.
 */

import { useState, useEffect } from 'react'
import { projectsApi } from '../../../services/api'
import { useErrorHandler } from '../../../hooks/useErrorHandler'
import type { ProjectId } from '../../../types'

type ImageType = 'logo' | 'stamp' | 'signature'

/**
 * Hook for managing act images
 * 
 * @param projectId - Project ID
 * @returns Image state and handlers
 */
export function useActImages(projectId: ProjectId) {
  const { handleError } = useErrorHandler()
  const [images, setImages] = useState<Record<string, string>>({})
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)

  /**
   * Load images from server
   */
  const loadImages = async () => {
    try {
      const res = await projectsApi.getActImages(projectId)
      setImages(res.data)
    } catch {
      // Ignore errors
    }
  }

  useEffect(() => {
    loadImages()
  }, [projectId])

  /**
   * Handle image upload
   */
  const handleImageUpload = async (imageType: ImageType, file: File) => {
    setUploadingImage(imageType)
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      await projectsApi.uploadActImage(projectId, imageType, dataUrl)
      setImages(prev => ({ ...prev, [imageType]: dataUrl }))
    } catch (err) {
      handleError(err, 'Ошибка загрузки изображения')
    } finally {
      setUploadingImage(null)
    }
  }

  /**
   * Handle image delete
   */
  const handleImageDelete = async (imageType: ImageType) => {
    try {
      await projectsApi.deleteActImage(projectId, imageType)
      setImages(prev => {
        const next = { ...prev }
        delete next[imageType]
        return next
      })
    } catch (err) {
      handleError(err, 'Ошибка удаления изображения')
    }
  }

  return {
    images,
    uploadingImage,
    handleImageUpload,
    handleImageDelete,
    reloadImages: loadImages,
  }
}

