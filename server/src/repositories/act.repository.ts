import {
  actImageQueries,
  savedActQueries,
  savedActItemQueries,
} from '../models/database'
import {
  ActImageRow,
  SavedActRow,
  SavedActItemRow,
} from '../types/estimate'

/**
 * Репозиторий для работы с изображениями актов
 */
export class ActImageRepository {
  /**
   * Найти все изображения акта для сметы
   */
  findByEstimateId(estimateId: string): ActImageRow[] {
    return actImageQueries.findByEstimateId.all(estimateId) as ActImageRow[]
  }

  /**
   * Найти изображение по типу для сметы
   */
  findByEstimateAndType(
    estimateId: string,
    imageType: string
  ): ActImageRow | undefined {
    return actImageQueries.findByEstimateAndType.get(
      estimateId,
      imageType
    ) as ActImageRow | undefined
  }

  /**
   * Создать или обновить изображение акта
   */
  upsert(
    id: string,
    estimateId: string,
    imageType: string,
    data: string
  ): void {
    actImageQueries.upsert.run(id, estimateId, imageType, data)
  }

  /**
   * Удалить изображение акта
   */
  delete(estimateId: string, imageType: string): void {
    actImageQueries.delete.run(estimateId, imageType)
  }
}

/**
 * Репозиторий для работы с сохраненными актами
 */
export class SavedActRepository {
  /**
   * Найти все акты для сметы
   */
  findByEstimateId(estimateId: string): SavedActRow[] {
    return savedActQueries.findByEstimateId.all(estimateId) as SavedActRow[]
  }

  /**
   * Найти акт по ID
   */
  findById(id: string): SavedActRow | undefined {
    return savedActQueries.findById.get(id) as SavedActRow | undefined
  }

  /**
   * Создать акт
   */
  create(
    id: string,
    estimateId: string,
    viewId: string | null,
    actNumber: string,
    actDate: string,
    executorName: string,
    executorDetails: string,
    customerName: string,
    directorName: string,
    serviceName: string,
    selectionMode: string,
    grandTotal: number
  ): void {
    savedActQueries.create.run(
      id,
      estimateId,
      viewId,
      actNumber,
      actDate,
      executorName,
      executorDetails,
      customerName,
      directorName,
      serviceName,
      selectionMode,
      grandTotal
    )
  }

  /**
   * Удалить акт
   */
  delete(id: string): void {
    savedActQueries.delete.run(id)
  }
}

/**
 * Репозиторий для работы с позициями сохраненных актов
 */
export class SavedActItemRepository {
  /**
   * Найти все позиции акта
   */
  findByActId(actId: string): SavedActItemRow[] {
    return savedActItemQueries.findByActId.all(actId) as SavedActItemRow[]
  }

  /**
   * Найти все позиции сметы, использованные в актах
   */
  findByEstimateItemIds(
    estimateId: string
  ): (SavedActItemRow & { act_number: string; act_date: string; act_id: string })[] {
    return savedActItemQueries.findByEstimateItemIds.all(
      estimateId
    ) as (SavedActItemRow & {
      act_number: string
      act_date: string
      act_id: string
    })[]
  }

  /**
   * Создать позицию акта
   */
  create(
    id: string,
    actId: string,
    itemId: string | null,
    sectionId: string | null,
    name: string,
    unit: string,
    quantity: number,
    price: number,
    total: number
  ): void {
    savedActItemQueries.create.run(
      id,
      actId,
      itemId,
      sectionId,
      name,
      unit,
      quantity,
      price,
      total
    )
  }
}

export const actImageRepository = new ActImageRepository()
export const savedActRepository = new SavedActRepository()
export const savedActItemRepository = new SavedActItemRepository()

