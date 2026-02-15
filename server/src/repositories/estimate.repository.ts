import { estimateQueries } from '../models/database'
import { EstimateRow } from '../types/estimate'

/**
 * Репозиторий для работы со сметами
 */
export class EstimateRepository {
  /**
   * Найти все сметы пользователя
   */
  findByBrigadirId(brigadirId: string): EstimateRow[] {
    return estimateQueries.findByBrigadirId.all(brigadirId) as EstimateRow[]
  }

  /**
   * Найти смету по ID
   */
  findById(id: string): EstimateRow | undefined {
    return estimateQueries.findById.get(id) as EstimateRow | undefined
  }

  /**
   * Создать смету
   */
  create(
    id: string,
    brigadirId: string,
    googleSheetId: string,
    title: string,
    customerLinkToken: string,
    masterLinkToken: string,
    columnMapping: string = '{}'
  ): void {
    estimateQueries.create.run(
      id,
      brigadirId,
      googleSheetId,
      title,
      customerLinkToken,
      masterLinkToken,
      columnMapping
    )
  }

  /**
   * Обновить смету
   */
  update(
    id: string,
    brigadirId: string,
    googleSheetId: string,
    title: string
  ): boolean {
    const result = estimateQueries.update.run(googleSheetId, title, id, brigadirId)
    return result.changes > 0
  }

  /**
   * Обновить данные заказчика
   */
  updateCustomerData(
    id: string,
    customerEmail: string | null,
    customerPhone: string | null,
    customerName: string | null
  ): void {
    estimateQueries.updateCustomerData.run(customerEmail, customerPhone, customerName, id)
  }

  /**
   * Обновить время последней синхронизации
   */
  updateLastSynced(id: string): void {
    estimateQueries.updateLastSynced.run(id)
  }

  /**
   * Удалить смету
   */
  delete(id: string, brigadirId: string): boolean {
    const result = estimateQueries.delete.run(id, brigadirId)
    return result.changes > 0
  }
}

export const estimateRepository = new EstimateRepository()

