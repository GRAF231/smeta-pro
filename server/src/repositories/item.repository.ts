import { itemQueries } from '../models/database'
import { ItemRow } from '../types/estimate'

/**
 * Репозиторий для работы с позициями сметы
 */
export class ItemRepository {
  /**
   * Найти все позиции сметы
   */
  findByEstimateId(estimateId: string): ItemRow[] {
    return itemQueries.findByEstimateId.all(estimateId) as ItemRow[]
  }

  /**
   * Найти все позиции раздела
   */
  findBySectionId(sectionId: string): ItemRow[] {
    return itemQueries.findBySectionId.all(sectionId) as ItemRow[]
  }

  /**
   * Найти позицию по ID
   */
  findById(id: string): ItemRow | undefined {
    return itemQueries.findById.get(id) as ItemRow | undefined
  }

  /**
   * Создать позицию
   */
  create(
    id: string,
    estimateId: string,
    sectionId: string,
    number: string,
    name: string,
    unit: string,
    quantity: number,
    sortOrder: number
  ): void {
    itemQueries.create.run(id, estimateId, sectionId, number, name, unit, quantity, sortOrder)
  }

  /**
   * Обновить позицию
   */
  update(id: string, name: string, unit: string, quantity: number): void {
    itemQueries.update.run(name, unit, quantity, id)
  }

  /**
   * Удалить позицию
   */
  delete(id: string): void {
    itemQueries.delete.run(id)
  }

  /**
   * Удалить все позиции сметы
   */
  deleteByEstimateId(estimateId: string): void {
    itemQueries.deleteByEstimateId.run(estimateId)
  }
}

export const itemRepository = new ItemRepository()

