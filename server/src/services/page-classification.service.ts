import sharp from 'sharp'
import { classifyPages as classifyPagesAI, PageClassification } from './openrouter'
import { pageClassificationRepository } from '../repositories/page-classification.repository'
import { PageClassificationRow } from '../types/estimate'

export interface ClassificationResult {
  classifications: PageClassification[]
  savedClassifications: PageClassificationRow[]
}

/**
 * Сервис для классификации страниц PDF
 */
export class PageClassificationService {
  /**
   * Классифицировать страницы PDF
   * @param taskId ID задачи генерации
   * @param pageImages Массив data URLs изображений страниц
   * @returns Результат классификации
   */
  async classifyPages(
    taskId: string,
    pageImages: string[]
  ): Promise<ClassificationResult> {
    if (pageImages.length === 0) {
      throw new Error('Необходимо предоставить хотя бы одну страницу')
    }

    console.log(`[PageClassification] Starting classification for ${pageImages.length} pages`)

    // Step 1: Create thumbnails for AI (to save tokens)
    const thumbnails: string[] = []
    for (let i = 0; i < pageImages.length; i++) {
      try {
        // Extract base64 from data URL
        const base64Match = pageImages[i].match(/^data:image\/[^;]+;base64,(.+)$/)
        if (!base64Match) {
          throw new Error(`Invalid data URL format for page ${i + 1}`)
        }

        const imageBuffer = Buffer.from(base64Match[1], 'base64')
        
        // Create thumbnail: resize to max 400px width, quality 60
        const thumbnailBuffer = await sharp(imageBuffer)
          .resize(400, null, { withoutEnlargement: true })
          .jpeg({ quality: 60 })
          .toBuffer()

        const thumbnailDataUrl = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`
        thumbnails.push(thumbnailDataUrl)

        if ((i + 1) % 10 === 0) {
          console.log(`[PageClassification] Created ${i + 1}/${pageImages.length} thumbnails`)
        }
      } catch (err) {
        console.error(`[PageClassification] Error creating thumbnail for page ${i + 1}:`, err)
        // Use original image if thumbnail creation fails
        thumbnails.push(pageImages[i])
      }
    }

    console.log(`[PageClassification] Created ${thumbnails.length} thumbnails, sending to AI...`)

    // Step 2: Send to AI for classification
    const classifications = await classifyPagesAI(thumbnails)

    if (classifications.length !== pageImages.length) {
      console.warn(
        `[PageClassification] AI returned ${classifications.length} classifications, expected ${pageImages.length}`
      )
    }

    // Step 3: Save classifications to DB
    const savedClassifications: PageClassificationRow[] = []
    for (let i = 0; i < pageImages.length; i++) {
      const classification = classifications[i] || {
        pageNumber: i + 1,
        pageType: 'other' as const,
        roomName: null,
      }

      // Ensure page number matches
      const pageNumber = i + 1
      const pageType = classification.pageType || 'other'
      const roomName = classification.roomName || null

      const id = pageClassificationRepository.saveClassification(
        taskId,
        pageNumber,
        pageType,
        roomName,
        pageImages[i] // Save full-size image
      )

      // Fetch saved classification
      const saved = pageClassificationRepository.findById(id)
      if (saved) {
        savedClassifications.push(saved)
      }
    }

    console.log(
      `[PageClassification] Saved ${savedClassifications.length} classifications to DB`
    )

    return {
      classifications: classifications.slice(0, pageImages.length),
      savedClassifications,
    }
  }

  /**
   * Получить классификации для задачи
   */
  getClassifications(taskId: string): PageClassificationRow[] {
    return pageClassificationRepository.getByTask(taskId)
  }

  /**
   * Получить страницы определенного типа
   */
  getByType(
    taskId: string,
    pageType: 'plan' | 'wall_layout' | 'specification' | 'visualization' | 'other'
  ): PageClassificationRow[] {
    return pageClassificationRepository.getByTaskAndType(taskId, pageType)
  }

  /**
   * Получить страницы помещения
   */
  getByRoom(taskId: string, roomName: string): PageClassificationRow[] {
    return pageClassificationRepository.getByTaskAndRoom(taskId, roomName)
  }
}

export const pageClassificationService = new PageClassificationService()

