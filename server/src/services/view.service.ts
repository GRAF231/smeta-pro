import { v4 as uuidv4 } from 'uuid'
import {
  viewRepository,
  viewSectionSettingsRepository,
  viewItemSettingsRepository,
} from '../repositories/view.repository'
import { sectionRepository } from '../repositories/section.repository'
import { itemRepository } from '../repositories/item.repository'
import {
  EstimateView,
  CreateViewInput,
  UpdateViewInput,
} from '../types/estimate'
import { NotFoundError, ValidationError } from '../utils/errors'

/**
 * Сервис для работы с представлениями сметы
 */
export class ViewService {
  /**
   * Получить все представления сметы
   */
  getViewsByEstimateId(estimateId: string): EstimateView[] {
    const views = viewRepository.findByEstimateId(estimateId)
    return views.map(v => ({
      id: v.id,
      name: v.name,
      linkToken: v.link_token,
      password: v.password || '',
      sortOrder: v.sort_order,
    }))
  }

  /**
   * Создать новое представление
   */
  createView(estimateId: string, input: CreateViewInput): EstimateView {
    const viewId = uuidv4()
    const linkToken = uuidv4()
    const maxOrder = viewRepository.getMaxSortOrder(estimateId)

    viewRepository.create(
      viewId,
      estimateId,
      input.name || 'Новое представление',
      linkToken,
      null,
      maxOrder + 1
    )

    // Create section settings for all existing sections (visible by default)
    const sections = sectionRepository.findByEstimateId(estimateId)
    for (const section of sections) {
      viewSectionSettingsRepository.upsert(
        uuidv4(),
        viewId,
        section.id,
        true
      )
    }

    // Create item settings for all existing items (price=0, visible by default)
    const items = itemRepository.findByEstimateId(estimateId)
    for (const item of items) {
      viewItemSettingsRepository.upsert(
        uuidv4(),
        viewId,
        item.id,
        0,
        0,
        true
      )
    }

    const view = viewRepository.findById(viewId)!
    return {
      id: view.id,
      name: view.name,
      linkToken: view.link_token,
      password: view.password || '',
      sortOrder: view.sort_order,
    }
  }

  /**
   * Обновить представление
   */
  updateView(
    estimateId: string,
    viewId: string,
    input: UpdateViewInput
  ): EstimateView {
    const view = viewRepository.findById(viewId)
    if (!view || view.estimate_id !== estimateId) {
      throw new NotFoundError('Представление')
    }

    const newPassword =
      input.password !== undefined
        ? input.password.trim() || null
        : view.password
    const newName = input.name || view.name

    viewRepository.update(viewId, newName, newPassword)

    return {
      id: view.id,
      name: newName,
      linkToken: view.link_token,
      password: newPassword || '',
      sortOrder: view.sort_order,
    }
  }

  /**
   * Удалить представление
   */
  deleteView(estimateId: string, viewId: string): void {
    const view = viewRepository.findById(viewId)
    if (!view || view.estimate_id !== estimateId) {
      throw new NotFoundError('Представление')
    }

    // Check minimum: must have at least 1 view
    const views = viewRepository.findByEstimateId(estimateId)
    if (views.length <= 1) {
      throw new ValidationError('Нельзя удалить последнее представление')
    }

    // Delete view settings first
    viewSectionSettingsRepository.deleteByViewId(viewId)
    viewItemSettingsRepository.deleteByViewId(viewId)
    viewRepository.delete(viewId)
  }

  /**
   * Дублировать представление
   */
  duplicateView(estimateId: string, viewId: string): EstimateView {
    const sourceView = viewRepository.findById(viewId)
    if (!sourceView || sourceView.estimate_id !== estimateId) {
      throw new NotFoundError('Представление')
    }

    const newViewId = uuidv4()
    const newLinkToken = uuidv4()
    const maxOrder = viewRepository.getMaxSortOrder(estimateId)
    const newName = `${sourceView.name} (копия)`

    viewRepository.create(
      newViewId,
      estimateId,
      newName,
      newLinkToken,
      null,
      maxOrder + 1
    )

    // Copy section settings from source view
    const sourceSectionSettings =
      viewSectionSettingsRepository.findByViewId(sourceView.id)
    for (const ss of sourceSectionSettings) {
      viewSectionSettingsRepository.upsert(
        uuidv4(),
        newViewId,
        ss.section_id,
        Boolean(ss.visible)
      )
    }

    // Copy item settings from source view (with prices!)
    const sourceItemSettings =
      viewItemSettingsRepository.findByViewId(sourceView.id)
    for (const is of sourceItemSettings) {
      viewItemSettingsRepository.upsert(
        uuidv4(),
        newViewId,
        is.item_id,
        is.price,
        is.total,
        Boolean(is.visible)
      )
    }

    return {
      id: newViewId,
      name: newName,
      linkToken: newLinkToken,
      password: '',
      sortOrder: maxOrder + 1,
    }
  }

  /**
   * Обновить настройки видимости раздела в представлении
   */
  updateSectionSettings(
    estimateId: string,
    viewId: string,
    sectionId: string,
    visible: boolean
  ): void {
    const view = viewRepository.findById(viewId)
    if (!view || view.estimate_id !== estimateId) {
      throw new NotFoundError('Представление')
    }

    viewSectionSettingsRepository.upsert(
      uuidv4(),
      viewId,
      sectionId,
      visible
    )
  }

  /**
   * Обновить настройки позиции в представлении
   */
  updateItemSettings(
    estimateId: string,
    viewId: string,
    itemId: string,
    price: number | undefined,
    visible: boolean | undefined
  ): { price: number; total: number; visible: boolean } {
    const view = viewRepository.findById(viewId)
    if (!view || view.estimate_id !== estimateId) {
      throw new NotFoundError('Представление')
    }

    const item = itemRepository.findById(itemId)
    if (!item) {
      throw new NotFoundError('Позиция')
    }

    // Get existing setting to merge
    const existing = viewItemSettingsRepository.findByViewAndItem(
      viewId,
      itemId
    )

    const newPrice = price !== undefined ? price : existing?.price || 0
    const newVisible =
      visible !== undefined ? visible : existing?.visible !== 0
    const newTotal = item.quantity * newPrice

    viewItemSettingsRepository.upsert(
      uuidv4(),
      viewId,
      itemId,
      newPrice,
      newTotal,
      newVisible
    )

    return {
      price: newPrice,
      total: newTotal,
      visible: newVisible,
    }
  }
}

export const viewService = new ViewService()

