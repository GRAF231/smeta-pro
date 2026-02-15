import { Response } from 'express'
import { AuthRequest } from '../types/common'
import { viewService } from '../services/view.service'
import { requireString } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response'

/**
 * Контроллер для обработки запросов представлений
 */
export class ViewController {
  /**
   * Получить все представления сметы
   */
  getViews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const views = viewService.getViewsByEstimateId(estimateId)
    sendSuccess(res, views)
  })

  /**
   * Создать представление
   */
  createView = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const name = req.body.name || 'Новое представление'
    const view = viewService.createView(estimateId, { name })
    sendCreated(res, view)
  })

  /**
   * Обновить представление
   */
  updateView = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const viewId = String(req.params.viewId)
    const name = req.body.name
    const password = req.body.password

    const view = viewService.updateView(estimateId, viewId, {
      name,
      password,
    })
    sendSuccess(res, {
      success: true,
      ...view,
    })
  })

  /**
   * Дублировать представление
   */
  duplicateView = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const viewId = String(req.params.viewId)
    const view = viewService.duplicateView(estimateId, viewId)
    sendCreated(res, view)
  })

  /**
   * Удалить представление
   */
  deleteView = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const viewId = String(req.params.viewId)
    viewService.deleteView(estimateId, viewId)
    sendNoContent(res)
  })

  /**
   * Обновить настройки раздела в представлении
   */
  updateSectionSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const viewId = String(req.params.viewId)
    const sectionId = String(req.params.sectionId)
    const visible = Boolean(req.body.visible)
    viewService.updateSectionSettings(estimateId, viewId, sectionId, visible)
    sendSuccess(res, { success: true })
  })

  /**
   * Обновить настройки позиции в представлении
   */
  updateItemSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const viewId = String(req.params.viewId)
    const itemId = String(req.params.itemId)
    const price = req.body.price
    const visible = req.body.visible

    const result = viewService.updateItemSettings(
      estimateId,
      viewId,
      itemId,
      price,
      visible
    )
    sendSuccess(res, { success: true, ...result })
  })

  /**
   * Установить представление как смету для заказчика
   */
  setCustomerView = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const viewId = String(req.params.viewId)
    const view = viewService.setCustomerView(estimateId, viewId)
    sendSuccess(res, view)
  })
}

export const viewController = new ViewController()

