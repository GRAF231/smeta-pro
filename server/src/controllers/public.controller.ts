import { Response } from 'express'
import { Request } from 'express'
import { estimateService } from '../services/estimate.service'
import { requireString } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess } from '../utils/response'

/**
 * Контроллер для публичных представлений (без авторизации)
 */
export class PublicController {
  /**
   * Получить публичное представление по токену
   */
  getPublicView = asyncHandler(async (req: Request, res: Response) => {
    const token = requireString(String(req.params.token), 'Токен')
    const result = estimateService.getPublicView(token)
    sendSuccess(res, result)
  })

  /**
   * Проверить пароль и получить публичное представление
   */
  verifyPassword = asyncHandler(async (req: Request, res: Response) => {
    const token = requireString(String(req.params.token), 'Токен')
    const password = req.body.password || ''
    const result = estimateService.verifyPasswordAndGetView(token, { password })
    sendSuccess(res, result)
  })

  /**
   * Legacy: получить представление заказчика
   */
  getCustomerView = asyncHandler(async (req: Request, res: Response) => {
    const token = requireString(String(req.params.token), 'Токен')
    const result = estimateService.getPublicView(token)
    sendSuccess(res, result)
  })

  /**
   * Legacy: получить представление мастера
   */
  getMasterView = asyncHandler(async (req: Request, res: Response) => {
    const token = requireString(String(req.params.token), 'Токен')
    const result = estimateService.getPublicView(token)
    sendSuccess(res, result)
  })

  /**
   * Legacy: проверить пароль мастера
   */
  verifyMasterPassword = asyncHandler(async (req: Request, res: Response) => {
    const token = requireString(String(req.params.token), 'Токен')
    const password = req.body.password || ''
    const result = estimateService.verifyPasswordAndGetView(token, { password })
    sendSuccess(res, result)
  })
}

export const publicController = new PublicController()

