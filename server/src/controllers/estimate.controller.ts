import { Response } from 'express'
import { AuthRequest } from '../types/common'
import { estimateService } from '../services/estimate.service'
import { pdfGenerationService } from '../services/pdf-generation.service'
import { requireString } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response'

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
}

export const estimateController = new EstimateController()

