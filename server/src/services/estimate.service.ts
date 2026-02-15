import { v4 as uuidv4 } from 'uuid'
import { estimateRepository } from '../repositories/estimate.repository'
import { sectionRepository } from '../repositories/section.repository'
import { itemRepository } from '../repositories/item.repository'
import {
  viewRepository,
  viewSectionSettingsRepository,
  viewItemSettingsRepository,
} from '../repositories/view.repository'
import { paymentRepository, paymentItemRepository } from '../repositories/payment.repository'
import { savedActItemRepository } from '../repositories/act.repository'
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
      balance: estimate.balance || 0,
      lastSyncedAt: estimate.last_synced_at,
      createdAt: estimate.created_at,
      views: views.map(v => ({
        id: v.id,
        name: v.name,
        linkToken: v.link_token,
        password: v.password || '',
        sortOrder: v.sort_order,
        isCustomerView: Boolean(v.is_customer_view),
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
        balance: e.balance || 0,
        lastSyncedAt: e.last_synced_at,
        createdAt: e.created_at,
        views: views.map(v => ({
          id: v.id,
          name: v.name,
          linkToken: v.link_token,
          password: v.password || '',
          sortOrder: v.sort_order,
          isCustomerView: Boolean(v.is_customer_view),
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
        0,
        true // isCustomerView
      )
      viewRepository.create(
        masterViewId,
        id,
        'Мастер',
        masterLinkToken,
        null,
        1,
        false // isCustomerView
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
        0,
        true // isCustomerView
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

    // Determine if this is customer view or master view
    const viewRow = viewRepository.findById(view.id)
    const isCustomerView = viewRow ? Boolean(viewRow.is_customer_view) : false

    // Prepare data for recalculating paid and completed amounts per item
    const allPaymentItems = paymentItemRepository.findByEstimateId(view.estimate_id)
    const allActItems = savedActItemRepository.findByEstimateItemIds(view.estimate_id)

    // Build customer price map if needed (for master view recalculation)
    const customerPriceMap = new Map<string, number>()
    if (!isCustomerView) {
      const allViews = viewRepository.findByEstimateId(view.estimate_id)
      const customerView = allViews.find(v => v.is_customer_view === 1)
      const customerViewSettings = customerView 
        ? viewItemSettingsRepository.findByViewId(customerView.id)
        : []
      for (const setting of customerViewSettings) {
        customerPriceMap.set(setting.item_id, setting.price)
      }
    }

    // Build maps for paid and completed amounts per item (recalculated for current view)
    const paidItemsMap = new Map<string, number>() // item_id -> paid amount (real or recalculated)
    const completedItemsQuantityMap = new Map<string, number>() // item_id -> total quantity completed

    // Process payment items
    for (const paymentItem of allPaymentItems) {
      const item = items.find(i => i.id === paymentItem.item_id)
      if (!item) continue

      if (isCustomerView) {
        // For customer: use real payment amount
        const currentPaid = paidItemsMap.get(paymentItem.item_id) || 0
        paidItemsMap.set(paymentItem.item_id, currentPaid + paymentItem.amount)
      } else {
        // For master: recalculate using master prices
        // Since payments are always for full item cost, we use full item quantity
        const masterPrice = itemSettingsMap.get(paymentItem.item_id)?.price || 0
        
        if (masterPrice > 0) {
          // Recalculate using master view price for full item quantity
          const currentPaid = paidItemsMap.get(paymentItem.item_id) || 0
          paidItemsMap.set(paymentItem.item_id, currentPaid + (masterPrice * item.quantity))
        } else {
          // If no master price, still record the payment (use customer amount as fallback)
          const currentPaid = paidItemsMap.get(paymentItem.item_id) || 0
          paidItemsMap.set(paymentItem.item_id, currentPaid + paymentItem.amount)
        }
      }
    }

    // Process completed work items
    for (const actItem of allActItems) {
      if (actItem.item_id) {
        const currentQty = completedItemsQuantityMap.get(actItem.item_id) || 0
        completedItemsQuantityMap.set(actItem.item_id, currentQty + actItem.quantity)
      }
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
            
            // Calculate paid amount (real for customer, recalculated for master)
            const paidAmount = paidItemsMap.get(item.id) || 0
            
            // Calculate completed amount using prices from current view
            const completedQuantity = completedItemsQuantityMap.get(item.id) || 0
            let completedAmount = 0
            if (completedQuantity > 0) {
              // Always use price from current view if available
              if (settings.price > 0) {
                completedAmount = settings.price * completedQuantity
              } else {
                // If no price in current view settings, use fallback
                // For master view: try customer price, then act price
                // For customer view: use act price
                if (!isCustomerView) {
                  // Master view: prefer customer price for consistency
                  const customerPrice = customerPriceMap.get(item.id) || 0
                  if (customerPrice > 0) {
                    completedAmount = customerPrice * completedQuantity
                  } else {
                    // Fallback to act price
                    const actItem = allActItems.find(ai => ai.item_id === item.id)
                    if (actItem && actItem.price > 0) {
                      completedAmount = actItem.price * completedQuantity
                    }
                  }
                } else {
                  // Customer view: use act price as fallback
                  const actItem = allActItems.find(ai => ai.item_id === item.id)
                  if (actItem && actItem.price > 0) {
                    completedAmount = actItem.price * completedQuantity
                  }
                }
              }
            }
            
            return {
              number: String(itemNumber++),
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              price: settings.price,
              total: settings.total,
              paidAmount,
              completedAmount,
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

    // Calculate balance using the same recalculated amounts from paidItemsMap and completedItemsQuantityMap
    // This ensures consistency with the per-item amounts shown in the table
    let totalPaid = 0
    for (const [itemId, paidAmount] of paidItemsMap.entries()) {
      totalPaid += paidAmount
    }

    let totalCompleted = 0
    for (const [itemId, completedQuantity] of completedItemsQuantityMap.entries()) {
      const item = items.find(i => i.id === itemId)
      if (item) {
        const settings = itemSettingsMap.get(itemId)
        if (settings && settings.price > 0) {
          // Use price from current view
          totalCompleted += settings.price * completedQuantity
        } else {
          // If no price in view settings, use price from act item (fallback)
          const actItem = allActItems.find(ai => ai.item_id === itemId)
          if (actItem) {
            totalCompleted += actItem.price * completedQuantity
          }
        }
      }
    }

    const balance = totalPaid - totalCompleted

    return {
      title: estimate.title,
      viewName: view.name,
      sections: visibleSections,
      total,
      balance,
    }
  }
}

export const estimateService = new EstimateService()
