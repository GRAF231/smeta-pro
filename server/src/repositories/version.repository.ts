import {
  versionQueries,
  versionSectionQueries,
  versionItemQueries,
  versionViewQueries,
  versionViewSectionSettingsQueries,
  versionViewItemSettingsQueries,
} from '../models/database'
import {
  VersionRow,
  VersionSectionRow,
  VersionItemRow,
  VersionViewRow,
  VersionViewSectionSettingRow,
  VersionViewItemSettingRow,
} from '../types/estimate'

/**
 * Репозиторий для работы с версиями сметы
 */
export class VersionRepository {
  /**
   * Найти все версии сметы
   */
  findByEstimateId(estimateId: string): VersionRow[] {
    return versionQueries.findByEstimateId.all(estimateId) as VersionRow[]
  }

  /**
   * Найти версию по ID
   */
  findById(id: string): VersionRow | undefined {
    return versionQueries.findById.get(id) as VersionRow | undefined
  }

  /**
   * Получить максимальный номер версии для сметы
   */
  getMaxVersionNumber(estimateId: string): number {
    const result = versionQueries.getMaxVersionNumber.get(estimateId) as {
      max_version: number
    } | undefined
    return result?.max_version || 0
  }

  /**
   * Создать версию
   */
  create(
    id: string,
    estimateId: string,
    versionNumber: number,
    name: string | null
  ): void {
    versionQueries.create.run(id, estimateId, versionNumber, name)
  }

  /**
   * Удалить версию
   */
  delete(id: string): void {
    versionQueries.delete.run(id)
  }
}

/**
 * Репозиторий для работы с разделами версии
 */
export class VersionSectionRepository {
  /**
   * Найти все разделы версии
   */
  findByVersionId(versionId: string): VersionSectionRow[] {
    return versionSectionQueries.findByVersionId.all(
      versionId
    ) as VersionSectionRow[]
  }

  /**
   * Создать раздел версии
   */
  create(
    id: string,
    versionId: string,
    originalSectionId: string,
    name: string,
    sortOrder: number
  ): void {
    versionSectionQueries.create.run(
      id,
      versionId,
      originalSectionId,
      name,
      sortOrder
    )
  }
}

/**
 * Репозиторий для работы с позициями версии
 */
export class VersionItemRepository {
  /**
   * Найти все позиции версии
   */
  findByVersionId(versionId: string): VersionItemRow[] {
    return versionItemQueries.findByVersionId.all(versionId) as VersionItemRow[]
  }

  /**
   * Найти все позиции раздела версии
   */
  findByVersionSectionId(versionSectionId: string): VersionItemRow[] {
    return versionItemQueries.findByVersionSectionId.all(
      versionSectionId
    ) as VersionItemRow[]
  }

  /**
   * Создать позицию версии
   */
  create(
    id: string,
    versionId: string,
    versionSectionId: string,
    originalItemId: string,
    number: string,
    name: string,
    unit: string,
    quantity: number,
    sortOrder: number
  ): void {
    versionItemQueries.create.run(
      id,
      versionId,
      versionSectionId,
      originalItemId,
      number,
      name,
      unit,
      quantity,
      sortOrder
    )
  }
}

/**
 * Репозиторий для работы с представлениями версии
 */
export class VersionViewRepository {
  /**
   * Найти все представления версии
   */
  findByVersionId(versionId: string): VersionViewRow[] {
    return versionViewQueries.findByVersionId.all(versionId) as VersionViewRow[]
  }

  /**
   * Создать представление версии
   */
  create(
    id: string,
    versionId: string,
    originalViewId: string,
    name: string,
    sortOrder: number
  ): void {
    versionViewQueries.create.run(id, versionId, originalViewId, name, sortOrder)
  }
}

/**
 * Репозиторий для работы с настройками разделов в представлениях версии
 */
export class VersionViewSectionSettingsRepository {
  /**
   * Найти все настройки разделов для версии
   */
  findByVersionId(versionId: string): VersionViewSectionSettingRow[] {
    return versionViewSectionSettingsQueries.findByVersionId.all(
      versionId
    ) as VersionViewSectionSettingRow[]
  }

  /**
   * Найти все настройки разделов для представления версии
   */
  findByVersionViewId(versionViewId: string): VersionViewSectionSettingRow[] {
    return versionViewSectionSettingsQueries.findByVersionViewId.all(
      versionViewId
    ) as VersionViewSectionSettingRow[]
  }

  /**
   * Создать настройки раздела для представления версии
   */
  create(
    id: string,
    versionId: string,
    versionViewId: string,
    versionSectionId: string,
    visible: boolean
  ): void {
    versionViewSectionSettingsQueries.create.run(
      id,
      versionId,
      versionViewId,
      versionSectionId,
      visible ? 1 : 0
    )
  }
}

/**
 * Репозиторий для работы с настройками позиций в представлениях версии
 */
export class VersionViewItemSettingsRepository {
  /**
   * Найти все настройки позиций для версии
   */
  findByVersionId(versionId: string): VersionViewItemSettingRow[] {
    return versionViewItemSettingsQueries.findByVersionId.all(
      versionId
    ) as VersionViewItemSettingRow[]
  }

  /**
   * Найти все настройки позиций для представления версии
   */
  findByVersionViewId(versionViewId: string): VersionViewItemSettingRow[] {
    return versionViewItemSettingsQueries.findByVersionViewId.all(
      versionViewId
    ) as VersionViewItemSettingRow[]
  }

  /**
   * Создать настройки позиции для представления версии
   */
  create(
    id: string,
    versionId: string,
    versionViewId: string,
    versionItemId: string,
    price: number,
    total: number,
    visible: boolean
  ): void {
    versionViewItemSettingsQueries.create.run(
      id,
      versionId,
      versionViewId,
      versionItemId,
      price,
      total,
      visible ? 1 : 0
    )
  }
}

export const versionRepository = new VersionRepository()
export const versionSectionRepository = new VersionSectionRepository()
export const versionItemRepository = new VersionItemRepository()
export const versionViewRepository = new VersionViewRepository()
export const versionViewSectionSettingsRepository =
  new VersionViewSectionSettingsRepository()
export const versionViewItemSettingsRepository =
  new VersionViewItemSettingsRepository()

