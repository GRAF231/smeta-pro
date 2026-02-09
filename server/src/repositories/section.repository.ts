import { sectionQueries } from '../models/database'
import { SectionRow } from '../types/estimate'

/**
 * Репозиторий для работы с разделами сметы
 */
export class SectionRepository {
  /**
   * Найти все разделы сметы
   */
  findByEstimateId(estimateId: string): SectionRow[] {
    return sectionQueries.findByEstimateId.all(estimateId) as SectionRow[]
  }

  /**
   * Найти раздел по ID
   */
  findById(id: string): SectionRow | undefined {
    return sectionQueries.findById.get(id) as SectionRow | undefined
  }

  /**
   * Создать раздел
   */
  create(id: string, estimateId: string, name: string, sortOrder: number): void {
    sectionQueries.create.run(id, estimateId, name, sortOrder)
  }

  /**
   * Обновить раздел
   */
  update(id: string, name: string): void {
    sectionQueries.update.run(name, id)
  }

  /**
   * Удалить раздел
   */
  delete(id: string): void {
    sectionQueries.delete.run(id)
  }

  /**
   * Удалить все разделы сметы
   */
  deleteByEstimateId(estimateId: string): void {
    sectionQueries.deleteByEstimateId.run(estimateId)
  }
}

export const sectionRepository = new SectionRepository()

