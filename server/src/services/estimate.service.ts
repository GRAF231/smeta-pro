import { v4 as uuidv4 } from 'uuid'
import { estimateRepository } from '../repositories/estimate.repository'
import { sectionRepository } from '../repositories/section.repository'
import { itemRepository } from '../repositories/item.repository'
import {
  viewRepository,
  viewSectionSettingsRepository,
  viewItemSettingsRepository,
} from '../repositories/view.repository'
import {
  EstimateResponse,
  EstimateListItem,
  CreateEstimateInput,
  UpdateEstimateInput,
  CreateSectionInput,
  UpdateSectionInput,
  CreateItemInput,
  UpdateItemInput,
  PublicViewResponse,
  PasswordRequiredResponse,
  VerifyPasswordInput,
} from '../types/estimate'
import { NotFoundError, ForbiddenError } from '../utils/errors'
import { parseEstimateData, fetchSheetData, extractSheetIdFromUrl } from '../services/googleSheets'
import { generateEstimateFromPDF as generateFromPDF } from '../services/openrouter'

/**
 * Сервис для работы со сметами
 */
export class EstimateService {
  /**
   * Построить полный ответ со сметой
   */
  buildEstimateResponse(estimateId: string): EstimateResponse {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    const views = viewRepository.findByEstimateId(estimate.id)
    const sections = sectionRepository.findByEstimateId(estimate.id)
    const items = itemRepository.findByEstimateId(estimate.id)

    // Load all view settings
    const allViewSectionSettings: Array<{
      id: string
      view_id: string
      section_id: string
      visible: number
    }> = []
    const allViewItemSettings: Array<{
      id: string
      view_id: string
      item_id: string
      price: number
      total: number
      visible: number
    }> = []

    for (const view of views) {
      const ss = viewSectionSettingsRepository.findByViewId(view.id)
      const is = viewItemSettingsRepository.findByViewId(view.id)
      allViewSectionSettings.push(...ss)
      allViewItemSettings.push(...is)
    }

    // Build section view settings map
    const sectionViewMap = new Map<
      string,
      Record<string, { visible: boolean }>
    >()
    for (const s of allViewSectionSettings) {
      if (!sectionViewMap.has(s.section_id))
        sectionViewMap.set(s.section_id, {})
      sectionViewMap.get(s.section_id)![s.view_id] = {
        visible: Boolean(s.visible),
      }
    }

    // Build item view settings map
    const itemViewMap = new Map<
      string,
      Record<string, { price: number; total: number; visible: boolean }>
    >()
    for (const i of allViewItemSettings) {
      if (!itemViewMap.has(i.item_id)) itemViewMap.set(i.item_id, {})
      itemViewMap.get(i.item_id)![i.view_id] = {
        price: i.price,
        total: i.total,
        visible: Boolean(i.visible),
      }
    }

    const sectionsWithItems = sections.map(section => ({
      id: section.id,
      name: section.name,
      sortOrder: section.sort_order,
      viewSettings: sectionViewMap.get(section.id) || {},
      items: items
        .filter(item => item.section_id === section.id)
        .map(item => ({
          id: item.id,
          number: item.number,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          sortOrder: item.sort_order,
          viewSettings: itemViewMap.get(item.id) || {},
        })),
    }))

    return {
      id: estimate.id,
      title: estimate.title,
      googleSheetId: estimate.google_sheet_id,
      lastSyncedAt: estimate.last_synced_at,
      createdAt: estimate.created_at,
      views: views.map(v => ({
        id: v.id,
        name: v.name,
        linkToken: v.link_token,
        password: v.password || '',
        sortOrder: v.sort_order,
      })),
      sections: sectionsWithItems,
    }
  }

  /**
   * Получить список всех смет пользователя
   */
  getEstimatesByBrigadirId(brigadirId: string): EstimateListItem[] {
    const estimates = estimateRepository.findByBrigadirId(brigadirId)
    return estimates.map(e => {
      const views = viewRepository.findByEstimateId(e.id)
      return {
        id: e.id,
        title: e.title,
        googleSheetId: e.google_sheet_id,
        lastSyncedAt: e.last_synced_at,
        createdAt: e.created_at,
        views: views.map(v => ({
          id: v.id,
          name: v.name,
          linkToken: v.link_token,
          password: v.password || '',
          sortOrder: v.sort_order,
        })),
      }
    })
  }

  /**
   * Создать новую смету
   */
  async createEstimate(
    brigadirId: string,
    input: CreateEstimateInput
  ): Promise<EstimateResponse> {
    const id = uuidv4()
    const customerLinkToken = uuidv4()
    const masterLinkToken = uuidv4()

    let googleSheetId = ''

    if (input.googleSheetUrl) {
      googleSheetId = extractSheetIdFromUrl(input.googleSheetUrl)
      const rows = await fetchSheetData(googleSheetId)

      estimateRepository.create(
        id,
        brigadirId,
        googleSheetId,
        input.title,
        customerLinkToken,
        masterLinkToken,
        '{}'
      )

      // Create default views
      const customerViewId = uuidv4()
      const masterViewId = uuidv4()
      viewRepository.create(
        customerViewId,
        id,
        'Заказчик',
        customerLinkToken,
        null,
        0
      )
      viewRepository.create(
        masterViewId,
        id,
        'Мастер',
        masterLinkToken,
        null,
        1
      )

      this.syncEstimateItems(id, rows, customerViewId, masterViewId)
      estimateRepository.updateLastSynced(id)
    } else {
      estimateRepository.create(
        id,
        brigadirId,
        '',
        input.title,
        customerLinkToken,
        masterLinkToken,
        '{}'
      )

      // Create default views
      viewRepository.create(
        uuidv4(),
        id,
        'Заказчик',
        customerLinkToken,
        null,
        0
      )
      viewRepository.create(
        uuidv4(),
        id,
        'Мастер',
        masterLinkToken,
        null,
        1
      )
    }

    return this.buildEstimateResponse(id)
  }

  /**
   * Обновить смету
   */
  async updateEstimate(
    id: string,
    brigadirId: string,
    input: UpdateEstimateInput
  ): Promise<EstimateResponse> {
    const estimate = estimateRepository.findById(id)
    if (!estimate || estimate.brigadir_id !== brigadirId) {
      throw new NotFoundError('Смета')
    }

    let googleSheetId = estimate.google_sheet_id
    if (input.googleSheetUrl) {
      googleSheetId = extractSheetIdFromUrl(input.googleSheetUrl)
    }

    estimateRepository.update(id, brigadirId, googleSheetId, input.title)
    return this.buildEstimateResponse(id)
  }

  /**
   * Удалить смету
   */
  deleteEstimate(id: string, brigadirId: string): void {
    const deleted = estimateRepository.delete(id, brigadirId)
    if (!deleted) {
      throw new NotFoundError('Смета')
    }
  }

  /**
   * Синхронизировать смету с Google Sheets
   */
  async syncEstimate(estimateId: string, brigadirId: string): Promise<void> {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate || estimate.brigadir_id !== brigadirId) {
      throw new NotFoundError('Смета')
    }

    if (!estimate.google_sheet_id) {
      throw new Error('Проект не привязан к Google таблице')
    }

    const rows = await fetchSheetData(estimate.google_sheet_id)

    // Clear existing items, sections, and their view settings
    itemRepository.deleteByEstimateId(estimate.id)
    sectionRepository.deleteByEstimateId(estimate.id)

    // Get first two views for customer/master mapping during sync
    const views = viewRepository.findByEstimateId(estimate.id)
    const customerViewId = views.length > 0 ? views[0].id : null
    const masterViewId = views.length > 1 ? views[1].id : null

    this.syncEstimateItems(estimate.id, rows, customerViewId, masterViewId)
    estimateRepository.updateLastSynced(estimate.id)
  }

  /**
   * Синхронизировать позиции сметы из данных Google Sheets
   */
  syncEstimateItems(
    estimateId: string,
    rows: string[][],
    customerViewId: string | null,
    masterViewId: string | null
  ): void {
    const customerData = parseEstimateData(rows, 'customer')
    const masterData = parseEstimateData(rows, 'master')

    // Create a map of master prices by item name
    const masterPriceMap = new Map<string, { price: number; total: number }>()
    masterData.sections.forEach(section => {
      section.items.forEach(item => {
        masterPriceMap.set(`${section.name}:${item.name}`, {
          price: item.price,
          total: item.total,
        })
      })
    })

    let sectionOrder = 0
    for (const section of customerData.sections) {
      const sectionId = uuidv4()
      sectionRepository.create(sectionId, estimateId, section.name, sectionOrder++)

      // Create section visibility for views
      if (customerViewId) {
        viewSectionSettingsRepository.upsert(
          uuidv4(),
          customerViewId,
          sectionId,
          true
        )
      }
      if (masterViewId) {
        viewSectionSettingsRepository.upsert(
          uuidv4(),
          masterViewId,
          sectionId,
          true
        )
      }
      // Also create for any other views
      const allViews = viewRepository.findByEstimateId(estimateId)
      for (const view of allViews) {
        if (view.id !== customerViewId && view.id !== masterViewId) {
          viewSectionSettingsRepository.upsert(
            uuidv4(),
            view.id,
            sectionId,
            true
          )
        }
      }

      let itemOrder = 0
      for (const item of section.items) {
        const masterInfo =
          masterPriceMap.get(`${section.name}:${item.name}`) || {
            price: 0,
            total: 0,
          }
        const itemId = uuidv4()

        itemRepository.create(
          itemId,
          estimateId,
          sectionId,
          item.number,
          item.name,
          item.unit,
          item.quantity,
          itemOrder++
        )

        // Create item settings for customer view
        if (customerViewId) {
          viewItemSettingsRepository.upsert(
            uuidv4(),
            customerViewId,
            itemId,
            item.price,
            item.total,
            true
          )
        }
        // Create item settings for master view
        if (masterViewId) {
          viewItemSettingsRepository.upsert(
            uuidv4(),
            masterViewId,
            itemId,
            masterInfo.price,
            masterInfo.total,
            masterInfo.total > 0
          )
        }
        // Create item settings for any other views
        for (const view of allViews) {
          if (view.id !== customerViewId && view.id !== masterViewId) {
            viewItemSettingsRepository.upsert(
              uuidv4(),
              view.id,
              itemId,
              0,
              0,
              true
            )
          }
        }
      }
    }
  }

  /**
   * Создать раздел
   */
  createSection(estimateId: string, input: CreateSectionInput): {
    id: string
    name: string
    items: never[]
  } {
    const sections = sectionRepository.findByEstimateId(estimateId)
    const maxOrder =
      sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : 0

    const id = uuidv4()
    sectionRepository.create(id, estimateId, input.name, maxOrder + 1)

    // Create view settings for all views
    const views = viewRepository.findByEstimateId(estimateId)
    for (const view of views) {
      viewSectionSettingsRepository.upsert(uuidv4(), view.id, id, true)
    }

    return { id, name: input.name, items: [] }
  }

  /**
   * Обновить раздел
   */
  updateSection(estimateId: string, sectionId: string, input: UpdateSectionInput): void {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    sectionRepository.update(sectionId, input.name)
  }

  /**
   * Удалить раздел
   */
  deleteSection(estimateId: string, sectionId: string): void {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    // Delete items in section first (cascades view settings)
    const items = itemRepository.findBySectionId(sectionId)
    for (const item of items) {
      viewItemSettingsRepository.deleteByItemId(item.id)
      itemRepository.delete(item.id)
    }

    // Delete section view settings
    viewSectionSettingsRepository.deleteBySectionId(sectionId)
    sectionRepository.delete(sectionId)
  }

  /**
   * Создать позицию
   */
  createItem(estimateId: string, input: CreateItemInput): {
    id: string
    name: string
    unit: string
    quantity: number
    sortOrder: number
  } {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    const id = uuidv4()
    const items = itemRepository.findBySectionId(input.sectionId)
    const maxOrder =
      items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0

    itemRepository.create(
      id,
      estimate.id,
      input.sectionId,
      '',
      input.name,
      input.unit || '',
      input.quantity || 0,
      maxOrder + 1
    )

    // Create view settings for all views
    const views = viewRepository.findByEstimateId(estimate.id)
    for (const view of views) {
      viewItemSettingsRepository.upsert(uuidv4(), view.id, id, 0, 0, true)
    }

    return {
      id,
      name: input.name,
      unit: input.unit || '',
      quantity: input.quantity || 0,
      sortOrder: maxOrder + 1,
    }
  }

  /**
   * Обновить позицию
   */
  updateItem(
    estimateId: string,
    itemId: string,
    input: UpdateItemInput
  ): void {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    const item = itemRepository.findById(itemId)
    if (!item) {
      throw new NotFoundError('Позиция')
    }

    const name = input.name !== undefined ? input.name : item.name
    const unit = input.unit !== undefined ? input.unit : item.unit
    const quantity = input.quantity !== undefined ? input.quantity : item.quantity

    itemRepository.update(itemId, name, unit, quantity)

    // Recalculate totals for all view settings of this item
    const viewSettings = viewItemSettingsRepository.findByItemId(itemId)
    for (const vs of viewSettings) {
      const newTotal = quantity * vs.price
      viewItemSettingsRepository.upsert(
        vs.id,
        vs.view_id,
        vs.item_id,
        vs.price,
        newTotal,
        Boolean(vs.visible)
      )
    }
  }

  /**
   * Удалить позицию
   */
  deleteItem(estimateId: string, itemId: string): void {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    viewItemSettingsRepository.deleteByItemId(itemId)
    itemRepository.delete(itemId)
  }

  /**
   * Получить публичное представление по токену
   */
  getPublicView(token: string): PublicViewResponse | PasswordRequiredResponse {
    const view = viewRepository.findByLinkToken(token)
    if (!view) {
      throw new NotFoundError('Смета')
    }

    if (view.password) {
      const estimate = estimateRepository.findById(view.estimate_id)!
      return {
        requiresPassword: true,
        title: estimate.title,
        viewName: view.name,
      }
    }

    return this.buildPublicViewData(view)
  }

  /**
   * Проверить пароль и получить публичное представление
   */
  verifyPasswordAndGetView(
    token: string,
    input: VerifyPasswordInput
  ): PublicViewResponse {
    const view = viewRepository.findByLinkToken(token)
    if (!view) {
      throw new NotFoundError('Смета')
    }

    if (view.password && view.password !== (input.password || '').trim()) {
      throw new ForbiddenError('Неверная кодовая фраза')
    }

    return this.buildPublicViewData(view)
  }

  /**
   * Построить данные публичного представления
   */
  private buildPublicViewData(view: {
    id: string
    estimate_id: string
    name: string
  }): PublicViewResponse {
    const estimate = estimateRepository.findById(view.estimate_id)!
    const sections = sectionRepository.findByEstimateId(view.estimate_id)
    const items = itemRepository.findByEstimateId(view.estimate_id)
    const sectionSettings = viewSectionSettingsRepository.findByViewId(view.id)
    const itemSettings = viewItemSettingsRepository.findByViewId(view.id)

    // Build maps
    const sectionVisMap = new Map<string, boolean>()
    for (const s of sectionSettings) {
      sectionVisMap.set(s.section_id, Boolean(s.visible))
    }

    const itemSettingsMap = new Map<
      string,
      { price: number; total: number; visible: boolean }
    >()
    for (const i of itemSettings) {
      itemSettingsMap.set(i.item_id, {
        price: i.price,
        total: i.total,
        visible: Boolean(i.visible),
      })
    }

    const visibleSections = sections
      .filter(s => sectionVisMap.get(s.id) !== false) // default visible
      .map(section => {
        let itemNumber = 1
        const sectionItems = items
          .filter(item => {
            if (item.section_id !== section.id) return false
            const settings = itemSettingsMap.get(item.id)
            return !settings || settings.visible
          })
          .map(item => {
            const settings = itemSettingsMap.get(item.id) || {
              price: 0,
              total: 0,
            }
            return {
              number: String(itemNumber++),
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              price: settings.price,
              total: settings.total,
            }
          })

        return {
          name: section.name,
          items: sectionItems,
          subtotal: sectionItems.reduce((sum, i) => sum + i.total, 0),
        }
      })
      .filter(s => s.items.length > 0)

    const total = visibleSections.reduce((sum, s) => sum + s.subtotal, 0)

    return {
      title: estimate.title,
      viewName: view.name,
      sections: visibleSections,
      total,
    }
  }
}

export const estimateService = new EstimateService()
