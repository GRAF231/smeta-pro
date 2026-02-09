import { materialQueries } from '../models/database'
import { MaterialRow } from '../types/material'

/**
 * Репозиторий для работы с материалами
 */
export class MaterialRepository {
  /**
   * Найти все материалы сметы
   */
  findByEstimateId(estimateId: string): MaterialRow[] {
    return materialQueries.findByEstimateId.all(estimateId) as MaterialRow[]
  }

  /**
   * Найти материал по ID
   */
  findById(id: string): MaterialRow | undefined {
    return materialQueries.findById.get(id) as MaterialRow | undefined
  }

  /**
   * Создать материал
   */
  create(
    id: string,
    estimateId: string,
    name: string,
    article: string,
    brand: string,
    unit: string,
    price: number,
    quantity: number,
    total: number,
    url: string,
    description: string,
    sortOrder: number
  ): void {
    materialQueries.create.run(
      id,
      estimateId,
      name,
      article,
      brand,
      unit,
      price,
      quantity,
      total,
      url,
      description,
      sortOrder
    )
  }

  /**
   * Обновить материал
   */
  update(
    id: string,
    name: string,
    article: string,
    brand: string,
    unit: string,
    price: number,
    quantity: number,
    total: number,
    url: string,
    description: string
  ): void {
    materialQueries.update.run(
      name,
      article,
      brand,
      unit,
      price,
      quantity,
      total,
      url,
      description,
      id
    )
  }

  /**
   * Удалить материал
   */
  delete(id: string): void {
    materialQueries.delete.run(id)
  }

  /**
   * Удалить все материалы сметы
   */
  deleteByEstimateId(estimateId: string): void {
    materialQueries.deleteByEstimateId.run(estimateId)
  }

  /**
   * Получить максимальный порядок сортировки материалов сметы
   */
  getMaxSortOrder(estimateId: string): number {
    const result = materialQueries.getMaxSortOrder.get(estimateId) as {
      max_order: number
    } | undefined
    return result?.max_order || 0
  }
}

export const materialRepository = new MaterialRepository()

