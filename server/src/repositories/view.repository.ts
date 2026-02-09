import {
  viewQueries,
  viewSectionSettingsQueries,
  viewItemSettingsQueries,
} from '../models/database'
import {
  ViewRow,
  ViewSectionSettingRow,
  ViewItemSettingRow,
} from '../types/estimate'

/**
 * Репозиторий для работы с представлениями сметы
 */
export class ViewRepository {
  /**
   * Найти все представления сметы
   */
  findByEstimateId(estimateId: string): ViewRow[] {
    return viewQueries.findByEstimateId.all(estimateId) as ViewRow[]
  }

  /**
   * Найти представление по ID
   */
  findById(id: string): ViewRow | undefined {
    return viewQueries.findById.get(id) as ViewRow | undefined
  }

  /**
   * Найти представление по токену ссылки
   */
  findByLinkToken(linkToken: string): ViewRow | undefined {
    return viewQueries.findByLinkToken.get(linkToken) as ViewRow | undefined
  }

  /**
   * Создать представление
   */
  create(
    id: string,
    estimateId: string,
    name: string,
    linkToken: string,
    password: string | null,
    sortOrder: number
  ): void {
    viewQueries.create.run(id, estimateId, name, linkToken, password, sortOrder)
  }

  /**
   * Обновить представление
   */
  update(id: string, name: string, password: string | null): void {
    viewQueries.update.run(name, password, id)
  }

  /**
   * Удалить представление
   */
  delete(id: string): void {
    viewQueries.delete.run(id)
  }

  /**
   * Удалить все представления сметы
   */
  deleteByEstimateId(estimateId: string): void {
    viewQueries.deleteByEstimateId.run(estimateId)
  }

  /**
   * Получить максимальный порядок сортировки представлений сметы
   */
  getMaxSortOrder(estimateId: string): number {
    const result = viewQueries.getMaxSortOrder.get(estimateId) as {
      max_order: number
    } | undefined
    return result?.max_order || 0
  }
}

/**
 * Репозиторий для работы с настройками разделов в представлениях
 */
export class ViewSectionSettingsRepository {
  /**
   * Найти все настройки разделов для представления
   */
  findByViewId(viewId: string): ViewSectionSettingRow[] {
    return viewSectionSettingsQueries.findByViewId.all(
      viewId
    ) as ViewSectionSettingRow[]
  }

  /**
   * Найти настройки конкретного раздела в представлении
   */
  findByViewAndSection(
    viewId: string,
    sectionId: string
  ): ViewSectionSettingRow | undefined {
    return viewSectionSettingsQueries.findByViewAndSection.get(
      viewId,
      sectionId
    ) as ViewSectionSettingRow | undefined
  }

  /**
   * Создать или обновить настройки раздела
   */
  upsert(
    id: string,
    viewId: string,
    sectionId: string,
    visible: boolean
  ): void {
    viewSectionSettingsQueries.upsert.run(
      id,
      viewId,
      sectionId,
      visible ? 1 : 0
    )
  }

  /**
   * Удалить все настройки разделов для представления
   */
  deleteByViewId(viewId: string): void {
    viewSectionSettingsQueries.deleteByViewId.run(viewId)
  }

  /**
   * Удалить все настройки для раздела
   */
  deleteBySectionId(sectionId: string): void {
    viewSectionSettingsQueries.deleteBySectionId.run(sectionId)
  }
}

/**
 * Репозиторий для работы с настройками позиций в представлениях
 */
export class ViewItemSettingsRepository {
  /**
   * Найти все настройки позиций для представления
   */
  findByViewId(viewId: string): ViewItemSettingRow[] {
    return viewItemSettingsQueries.findByViewId.all(
      viewId
    ) as ViewItemSettingRow[]
  }

  /**
   * Найти настройки конкретной позиции в представлении
   */
  findByViewAndItem(
    viewId: string,
    itemId: string
  ): ViewItemSettingRow | undefined {
    return viewItemSettingsQueries.findByViewAndItem.get(
      viewId,
      itemId
    ) as ViewItemSettingRow | undefined
  }

  /**
   * Найти все настройки для позиции
   */
  findByItemId(itemId: string): ViewItemSettingRow[] {
    return viewItemSettingsQueries.findByItemId.all(
      itemId
    ) as ViewItemSettingRow[]
  }

  /**
   * Создать или обновить настройки позиции
   */
  upsert(
    id: string,
    viewId: string,
    itemId: string,
    price: number,
    total: number,
    visible: boolean
  ): void {
    viewItemSettingsQueries.upsert.run(
      id,
      viewId,
      itemId,
      price,
      total,
      visible ? 1 : 0
    )
  }

  /**
   * Удалить все настройки позиций для представления
   */
  deleteByViewId(viewId: string): void {
    viewItemSettingsQueries.deleteByViewId.run(viewId)
  }

  /**
   * Удалить все настройки для позиции
   */
  deleteByItemId(itemId: string): void {
    viewItemSettingsQueries.deleteByItemId.run(itemId)
  }
}

export const viewRepository = new ViewRepository()
export const viewSectionSettingsRepository = new ViewSectionSettingsRepository()
export const viewItemSettingsRepository = new ViewItemSettingsRepository()

