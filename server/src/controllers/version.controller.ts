import { Response } from 'express'
import { AuthRequest } from '../types/common'
import { versionService } from '../services/version.service'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess, sendCreated } from '../utils/response'

/**
 * Контроллер для обработки запросов версий
 */
export class VersionController {
  /**
   * Получить все версии сметы
   */
  getVersions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const versions = versionService.getVersionsByEstimateId(estimateId)
    sendSuccess(res, versions)
  })

  /**
   * Создать версию
   */
  createVersion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const name = req.body.name
    const version = versionService.createVersion(estimateId, { name })
    sendCreated(res, version)
  })

  /**
   * Получить версию по ID
   */
  getVersion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const versionId = String(req.params.versionId)
    const version = versionService.getVersionById(estimateId, versionId)
    sendSuccess(res, version)
  })

  /**
   * Восстановить смету из версии
   */
  restoreVersion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const versionId = String(req.params.versionId)
    const result = versionService.restoreVersion(estimateId, versionId)
    sendSuccess(res, result)
  })
}

export const versionController = new VersionController()

