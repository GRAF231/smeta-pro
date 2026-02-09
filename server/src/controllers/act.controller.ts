import { Response } from 'express'
import { AuthRequest } from '../types/common'
import { actService } from '../services/act.service'
import { requireString, validateActImageType } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response'

/**
 * Контроллер для обработки запросов актов
 */
export class ActController {
  /**
   * Получить все акты сметы
   */
  getActs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const acts = actService.getActsByEstimateId(estimateId)
    sendSuccess(res, acts)
  })

  /**
   * Получить акт по ID
   */
  getAct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const actId = String(req.params.actId)
    const act = actService.getActById(estimateId, actId)
    sendSuccess(res, act)
  })

  /**
   * Создать акт
   */
  createAct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const act = actService.createAct(estimateId, req.body)
    sendCreated(res, act)
  })

  /**
   * Удалить акт
   */
  deleteAct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const actId = String(req.params.actId)
    actService.deleteAct(estimateId, actId)
    sendNoContent(res)
  })

  /**
   * Получить маппинг использованных позиций
   */
  getUsedItems = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const mapping = actService.getUsedItemsMapping(estimateId)
    sendSuccess(res, mapping)
  })

  /**
   * Получить изображения акта
   */
  getActImages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const images = actService.getActImages(estimateId)
    sendSuccess(res, images)
  })

  /**
   * Загрузить изображение акта
   */
  uploadActImage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const imageType = validateActImageType(req.body.imageType)
    const data = requireString(req.body.data, 'Данные изображения')

    const result = actService.uploadActImage(estimateId, {
      imageType,
      data,
    })
    sendSuccess(res, result)
  })

  /**
   * Удалить изображение акта
   */
  deleteActImage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const imageType = validateActImageType(String(req.params.imageType))
    actService.deleteActImage(estimateId, imageType)
    sendSuccess(res, { success: true })
  })
}

export const actController = new ActController()

