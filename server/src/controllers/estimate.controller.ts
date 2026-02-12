import { Response } from 'express'
import { AuthRequest } from '../types/common'
import { estimateService } from '../services/estimate.service'
import { pdfGenerationService } from '../services/pdf-generation.service'
import { pageClassificationService } from '../services/page-classification.service'
import { generationTaskRepository } from '../repositories/generation-task.repository'
import { requireString } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response'
import { PDFParse } from 'pdf-parse'
import sharp from 'sharp'

/**
 * Контроллер для обработки запросов смет
 */
export class EstimateController {
  /**
   * Получить все сметы пользователя
   */
  getEstimates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimates = estimateService.getEstimatesByBrigadirId(req.user!.id)
    sendSuccess(res, estimates)
  })

  /**
   * Получить смету по ID
   */
  getEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    // Check ownership first
    const estimates = estimateService.getEstimatesByBrigadirId(req.user!.id)
    const estimate = estimates.find(e => e.id === estimateId)
    if (!estimate) {
      throw new Error('Смета не найдена')
    }
    const fullEstimate = estimateService.buildEstimateResponse(estimateId)
    sendSuccess(res, fullEstimate)
  })

  /**
   * Создать смету
   */
  createEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const title = requireString(req.body.title, 'Название проекта')
    const googleSheetUrl = req.body.googleSheetUrl

    const estimate = await estimateService.createEstimate(req.user!.id, {
      title,
      googleSheetUrl,
    })
    sendCreated(res, estimate)
  })

  /**
   * Обновить смету
   */
  updateEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const title = requireString(req.body.title, 'Название проекта')
    const googleSheetUrl = req.body.googleSheetUrl

    const estimate = await estimateService.updateEstimate(
      estimateId,
      req.user!.id,
      { title, googleSheetUrl }
    )
    sendSuccess(res, estimate)
  })

  /**
   * Удалить смету
   */
  deleteEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    estimateService.deleteEstimate(estimateId, req.user!.id)
    sendNoContent(res)
  })

  /**
   * Синхронизировать смету с Google Sheets
   */
  syncEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    await estimateService.syncEstimate(estimateId, req.user!.id)
    sendSuccess(res, {
      message: 'Синхронизация завершена',
      syncedAt: new Date().toISOString(),
    })
  })

  /**
   * Создать раздел
   */
  createSection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const name = requireString(req.body.name, 'Название раздела')
    const section = estimateService.createSection(estimateId, { name })
    sendCreated(res, section)
  })

  /**
   * Обновить раздел
   */
  updateSection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const sectionId = String(req.params.sectionId)
    const name = requireString(req.body.name, 'Название раздела')
    estimateService.updateSection(estimateId, sectionId, { name })
    sendSuccess(res, { success: true })
  })

  /**
   * Удалить раздел
   */
  deleteSection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const sectionId = String(req.params.sectionId)
    estimateService.deleteSection(estimateId, sectionId)
    sendNoContent(res)
  })

  /**
   * Создать позицию
   */
  createItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const sectionId = requireString(req.body.sectionId, 'ID раздела')
    const name = requireString(req.body.name, 'Название позиции')
    const unit = req.body.unit
    const quantity = req.body.quantity

    const item = estimateService.createItem(estimateId, {
      sectionId,
      name,
      unit,
      quantity,
    })
    sendCreated(res, item)
  })

  /**
   * Обновить позицию
   */
  updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const itemId = String(req.params.itemId)
    const name = req.body.name
    const unit = req.body.unit
    const quantity = req.body.quantity

    estimateService.updateItem(estimateId, itemId, {
      name,
      unit,
      quantity,
    })
    sendSuccess(res, { success: true })
  })

  /**
   * Удалить позицию
   */
  deleteItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const itemId = String(req.params.itemId)
    estimateService.deleteItem(estimateId, itemId)
    sendNoContent(res)
  })

  /**
   * Генерировать смету из PDF
   */
  generateFromPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pdfFile = (req as any).file
    if (!pdfFile) {
      throw new Error('PDF файл обязателен')
    }

    const title = requireString(req.body.title, 'Название сметы')
    const pricelistUrl = requireString(req.body.pricelistUrl, 'Ссылка на прайс-лист')
    const comments = req.body.comments

    const estimate = await pdfGenerationService.generateEstimateFromPDF(
      req.user!.id,
      pdfFile.buffer,
      title,
      pricelistUrl,
      comments
    )
    sendCreated(res, estimate)
  })

  /**
   * Тестировать классификацию страниц PDF
   */
  testPageClassification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pdfFile = (req as any).file
    if (!pdfFile) {
      throw new Error('PDF файл обязателен')
    }

    // Create a test task
    const taskId = generationTaskRepository.create(
      req.user!.id,
      'processing',
      'stage_1',
      0
    )

    try {
      // Convert PDF to images
      const parser = new PDFParse({ data: new Uint8Array(pdfFile.buffer) })
      let pageDataUrls: string[]

      try {
        const screenshotResult = await parser.getScreenshot({
          imageDataUrl: false,
          imageBuffer: true,
          desiredWidth: 800,
        })

        if (!screenshotResult.pages || screenshotResult.pages.length === 0) {
          throw new Error('Не удалось обработать PDF. Убедитесь, что файл не поврежден.')
        }

        console.log(`[Test] Converting ${screenshotResult.pages.length} pages to JPEG...`)

        pageDataUrls = []
        for (let i = 0; i < screenshotResult.pages.length; i++) {
          const page = screenshotResult.pages[i]
          const jpegBuffer = await sharp(Buffer.from(page.data))
            .jpeg({ quality: 65 })
            .toBuffer()
          pageDataUrls.push(`data:image/jpeg;base64,${jpegBuffer.toString('base64')}`)
          ;(page as any).data = null
        }
      } catch (err) {
        console.error('PDF screenshot error:', err)
        throw new Error('Ошибка обработки PDF файла.')
      } finally {
        await parser.destroy().catch(() => {})
      }

      // Classify pages
      const result = await pageClassificationService.classifyPages(taskId, pageDataUrls)

      // Update task status
      generationTaskRepository.updateStatus(taskId, 'completed', 'stage_1', 100)

      sendSuccess(res, {
        taskId,
        totalPages: pageDataUrls.length,
        classifications: result.classifications,
        savedClassifications: result.savedClassifications,
      })
    } catch (error) {
      generationTaskRepository.setError(taskId, (error as Error).message)
      generationTaskRepository.updateStatus(taskId, 'failed', 'stage_1', 0)
      throw error
    }
  })
}

export const estimateController = new EstimateController()

