import { v4 as uuidv4 } from 'uuid'
import {
  actImageRepository,
  savedActRepository,
  savedActItemRepository,
} from '../repositories/act.repository'
import {
  ActInfo,
  ActDetails,
  CreateActInput,
  UsedItemsMapping,
  UploadActImageInput,
} from '../types/estimate'
import { NotFoundError, ValidationError } from '../utils/errors'

/**
 * Сервис для работы с актами
 */
export class ActService {
  /**
   * Получить все акты сметы
   */
  getActsByEstimateId(estimateId: string): ActInfo[] {
    const acts = savedActRepository.findByEstimateId(estimateId)
    return acts.map(a => ({
      id: a.id,
      actNumber: a.act_number,
      actDate: a.act_date,
      executorName: a.executor_name,
      customerName: a.customer_name,
      selectionMode: a.selection_mode,
      grandTotal: a.grand_total,
      createdAt: a.created_at,
    }))
  }

  /**
   * Получить акт по ID
   */
  getActById(estimateId: string, actId: string): ActDetails {
    const act = savedActRepository.findById(actId)
    if (!act || act.estimate_id !== estimateId) {
      throw new NotFoundError('Акт')
    }

    const items = savedActItemRepository.findByActId(act.id)

    return {
      id: act.id,
      actNumber: act.act_number,
      actDate: act.act_date,
      executorName: act.executor_name,
      executorDetails: act.executor_details,
      customerName: act.customer_name,
      directorName: act.director_name,
      serviceName: act.service_name,
      selectionMode: act.selection_mode,
      grandTotal: act.grand_total,
      createdAt: act.created_at,
      items: items.map(i => ({
        id: i.id,
        itemId: i.item_id,
        sectionId: i.section_id,
        name: i.name,
        unit: i.unit,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })),
    }
  }

  /**
   * Создать акт
   */
  createAct(estimateId: string, input: CreateActInput): {
    id: string
    actNumber: string
    actDate: string
    grandTotal: number
    createdAt: string
  } {
    if (!input.actNumber) {
      throw new ValidationError('Номер акта обязателен')
    }

    const actId = uuidv4()
    savedActRepository.create(
      actId,
      estimateId,
      input.viewId || null,
      input.actNumber,
      input.actDate || new Date().toISOString().split('T')[0],
      input.executorName || '',
      input.executorDetails || '',
      input.customerName || '',
      input.directorName || '',
      input.serviceName || '',
      input.selectionMode || 'sections',
      input.grandTotal || 0
    )

    // Save act items
    if (Array.isArray(input.items)) {
      for (const item of input.items) {
        savedActItemRepository.create(
          uuidv4(),
          actId,
          item.itemId || null,
          item.sectionId || null,
          item.name || '',
          item.unit || '',
          item.quantity || 0,
          item.price || 0,
          item.total || 0
        )
      }
    }

    return {
      id: actId,
      actNumber: input.actNumber,
      actDate: input.actDate || new Date().toISOString().split('T')[0],
      grandTotal: input.grandTotal || 0,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Удалить акт
   */
  deleteAct(estimateId: string, actId: string): void {
    const act = savedActRepository.findById(actId)
    if (!act || act.estimate_id !== estimateId) {
      throw new NotFoundError('Акт')
    }

    savedActRepository.delete(actId)
  }

  /**
   * Получить маппинг использованных позиций по актам
   */
  getUsedItemsMapping(estimateId: string): UsedItemsMapping {
    const rows = savedActItemRepository.findByEstimateItemIds(estimateId)

    // Build mapping: itemId -> array of { actId, actNumber, actDate }
    const usedItems: UsedItemsMapping = {}
    for (const row of rows) {
      if (!row.item_id) continue
      if (!usedItems[row.item_id]) usedItems[row.item_id] = []
      // Deduplicate by actId
      if (!usedItems[row.item_id].some(a => a.actId === row.act_id)) {
        usedItems[row.item_id].push({
          actId: row.act_id,
          actNumber: row.act_number,
          actDate: row.act_date,
        })
      }
    }

    return usedItems
  }

  /**
   * Получить изображения акта
   */
  getActImages(estimateId: string): Record<string, string> {
    const images = actImageRepository.findByEstimateId(estimateId)
    const result: Record<string, string> = {}
    images.forEach(img => {
      result[img.image_type] = img.data
    })
    return result
  }

  /**
   * Загрузить изображение акта
   */
  uploadActImage(
    estimateId: string,
    input: UploadActImageInput
  ): { success: boolean; imageType: string } {
    const id = uuidv4()
    actImageRepository.upsert(
      id,
      estimateId,
      input.imageType,
      input.data
    )
    return { success: true, imageType: input.imageType }
  }

  /**
   * Удалить изображение акта
   */
  deleteActImage(estimateId: string, imageType: string): void {
    actImageRepository.delete(estimateId, imageType)
  }
}

export const actService = new ActService()

