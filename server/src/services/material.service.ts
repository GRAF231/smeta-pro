import { v4 as uuidv4 } from 'uuid'
import { materialRepository } from '../repositories/material.repository'
import {
  Material,
  ParseMaterialsInput,
  UpdateMaterialInput,
  RefreshMaterialsResult,
} from '../types/material'
import { NotFoundError } from '../utils/errors'
import { parseProductsFromUrls } from '../services/openrouter'

/**
 * Сервис для работы с материалами
 */
export class MaterialService {
  /**
   * Получить все материалы сметы
   */
  getMaterialsByEstimateId(estimateId: string): Material[] {
    const materials = materialRepository.findByEstimateId(estimateId)
    return materials.map(m => ({
      id: m.id,
      estimateId: m.estimate_id,
      name: m.name,
      article: m.article,
      brand: m.brand,
      unit: m.unit,
      price: m.price,
      quantity: m.quantity,
      total: m.total,
      url: m.url,
      description: m.description,
      sortOrder: m.sort_order,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }))
  }

  /**
   * Парсить материалы из URL через ИИ
   */
  async parseMaterials(
    estimateId: string,
    input: ParseMaterialsInput
  ): Promise<Material[]> {
    if (!input.urls || !Array.isArray(input.urls) || input.urls.length === 0) {
      throw new Error('Необходимо указать хотя бы одну ссылку')
    }

    // Limit to 20 URLs at a time
    if (input.urls.length > 20) {
      throw new Error('Максимум 20 ссылок за раз')
    }

    // Validate URLs
    const validUrls: string[] = []
    for (const url of input.urls) {
      const trimmed = String(url).trim()
      if (!trimmed) continue
      try {
        new URL(trimmed)
        validUrls.push(trimmed)
      } catch {
        // Skip invalid URLs
        console.warn(`[Materials] Skipping invalid URL: ${trimmed}`)
      }
    }

    if (validUrls.length === 0) {
      throw new Error('Не найдено ни одной корректной ссылки')
    }

    // Parse products via AI
    const parsedProducts = await parseProductsFromUrls(validUrls)

    // Get current max sort order
    let sortOrder = materialRepository.getMaxSortOrder(estimateId)

    // Save to DB
    const savedMaterials: Material[] = []

    for (const product of parsedProducts) {
      const id = uuidv4()
      sortOrder++
      const total = product.price * 1 // quantity defaults to 1

      materialRepository.create(
        id,
        estimateId,
        product.name,
        product.article,
        product.brand,
        product.unit,
        product.price,
        1, // default quantity
        total,
        product.url,
        product.description,
        sortOrder
      )

      const saved = materialRepository.findById(id)!
      savedMaterials.push({
        id: saved.id,
        estimateId: saved.estimate_id,
        name: saved.name,
        article: saved.article,
        brand: saved.brand,
        unit: saved.unit,
        price: saved.price,
        quantity: saved.quantity,
        total: saved.total,
        url: saved.url,
        description: saved.description,
        sortOrder: saved.sort_order,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      })
    }

    return savedMaterials
  }

  /**
   * Обновить материал
   */
  updateMaterial(
    estimateId: string,
    materialId: string,
    input: UpdateMaterialInput
  ): Material {
    const material = materialRepository.findById(materialId)
    if (!material || material.estimate_id !== estimateId) {
      throw new NotFoundError('Материал')
    }

    const newPrice = input.price !== undefined ? input.price : material.price
    const newQuantity =
      input.quantity !== undefined ? input.quantity : material.quantity
    const total = newPrice * newQuantity

    materialRepository.update(
      materialId,
      input.name !== undefined ? input.name : material.name,
      input.article !== undefined ? input.article : material.article,
      input.brand !== undefined ? input.brand : material.brand,
      input.unit !== undefined ? input.unit : material.unit,
      newPrice,
      newQuantity,
      total,
      input.url !== undefined ? input.url : material.url,
      input.description !== undefined ? input.description : material.description
    )

    const updated = materialRepository.findById(materialId)!
    return {
      id: updated.id,
      estimateId: updated.estimate_id,
      name: updated.name,
      article: updated.article,
      brand: updated.brand,
      unit: updated.unit,
      price: updated.price,
      quantity: updated.quantity,
      total: updated.total,
      url: updated.url,
      description: updated.description,
      sortOrder: updated.sort_order,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    }
  }

  /**
   * Удалить материал
   */
  deleteMaterial(estimateId: string, materialId: string): void {
    const material = materialRepository.findById(materialId)
    if (!material || material.estimate_id !== estimateId) {
      throw new NotFoundError('Материал')
    }

    materialRepository.delete(materialId)
  }

  /**
   * Обновить все материалы (re-parse URLs)
   */
  async refreshMaterials(estimateId: string): Promise<RefreshMaterialsResult> {
    const materials = materialRepository.findByEstimateId(estimateId)
    const urlsToRefresh = materials
      .filter(m => m.url && m.url.trim())
      .map(m => ({ id: m.id, url: m.url, quantity: m.quantity }))

    if (urlsToRefresh.length === 0) {
      return {
        message: 'Нет материалов с ссылками для обновления',
        updated: 0,
        materials: this.getMaterialsByEstimateId(estimateId),
      }
    }

    // Parse all URLs
    const parsedProducts = await parseProductsFromUrls(
      urlsToRefresh.map(u => u.url)
    )

    // Update each material with new data
    let updatedCount = 0
    for (let i = 0; i < urlsToRefresh.length; i++) {
      const original = urlsToRefresh[i]
      const parsed = parsedProducts[i]
      if (!parsed || parsed.price === 0) continue

      const total = parsed.price * original.quantity

      materialRepository.update(
        original.id,
        parsed.name,
        parsed.article,
        parsed.brand,
        parsed.unit,
        parsed.price,
        original.quantity,
        total,
        parsed.url,
        parsed.description
      )
      updatedCount++
    }

    // Return updated list
    return {
      message: `Обновлено ${updatedCount} из ${urlsToRefresh.length} материалов`,
      updated: updatedCount,
      materials: this.getMaterialsByEstimateId(estimateId),
    }
  }

  /**
   * Обновить один материал
   */
  async refreshMaterial(
    estimateId: string,
    materialId: string
  ): Promise<Material> {
    const material = materialRepository.findById(materialId)
    if (!material || material.estimate_id !== estimateId) {
      throw new NotFoundError('Материал')
    }

    if (!material.url || !material.url.trim()) {
      throw new Error('У материала нет ссылки для обновления')
    }

    const parsedProducts = await parseProductsFromUrls([material.url])
    const parsed = parsedProducts[0]

    if (!parsed || parsed.price === 0) {
      throw new Error('Не удалось получить данные по ссылке')
    }

    const total = parsed.price * material.quantity

    materialRepository.update(
      materialId,
      parsed.name,
      parsed.article,
      parsed.brand,
      parsed.unit,
      parsed.price,
      material.quantity,
      total,
      parsed.url,
      parsed.description
    )

    const updated = materialRepository.findById(materialId)!
    return {
      id: updated.id,
      estimateId: updated.estimate_id,
      name: updated.name,
      article: updated.article,
      brand: updated.brand,
      unit: updated.unit,
      price: updated.price,
      quantity: updated.quantity,
      total: updated.total,
      url: updated.url,
      description: updated.description,
      sortOrder: updated.sort_order,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    }
  }
}

export const materialService = new MaterialService()

