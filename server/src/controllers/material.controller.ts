import { Response } from 'express'
import { AuthRequest } from '../types/common'
import { materialService } from '../services/material.service'
import { requireArray } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response'

/**
 * Контроллер для обработки запросов материалов
 */
export class MaterialController {
  /**
   * Получить все материалы сметы
   */
  getMaterials = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = String(req.params.projectId)
    const materials = materialService.getMaterialsByEstimateId(projectId)
    sendSuccess(res, materials)
  })

  /**
   * Парсить материалы из URL
   */
  parseMaterials = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = String(req.params.projectId)
    const urls = requireArray<string>(req.body.urls, 'Ссылки', 1)
    const materials = await materialService.parseMaterials(projectId, { urls })
    sendCreated(res, materials)
  })

  /**
   * Обновить материал
   */
  updateMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = String(req.params.projectId)
    const materialId = String(req.params.materialId)
    const material = materialService.updateMaterial(projectId, materialId, req.body)
    sendSuccess(res, material)
  })

  /**
   * Удалить материал
   */
  deleteMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = String(req.params.projectId)
    const materialId = String(req.params.materialId)
    materialService.deleteMaterial(projectId, materialId)
    sendNoContent(res)
  })

  /**
   * Обновить все материалы
   */
  refreshMaterials = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = String(req.params.projectId)
    const result = await materialService.refreshMaterials(projectId)
    sendSuccess(res, result)
  })

  /**
   * Обновить один материал
   */
  refreshMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = String(req.params.projectId)
    const materialId = String(req.params.materialId)
    const material = await materialService.refreshMaterial(projectId, materialId)
    sendSuccess(res, material)
  })
}

export const materialController = new MaterialController()

