import { v4 as uuidv4 } from 'uuid'
import {
  versionRepository,
  versionSectionRepository,
  versionItemRepository,
  versionViewRepository,
  versionViewSectionSettingsRepository,
  versionViewItemSettingsRepository,
} from '../repositories/version.repository'
import { sectionRepository } from '../repositories/section.repository'
import { itemRepository } from '../repositories/item.repository'
import {
  viewRepository,
  viewSectionSettingsRepository,
  viewItemSettingsRepository,
} from '../repositories/view.repository'
import {
  VersionInfo,
  CreateVersionInput,
  EstimateResponse,
} from '../types/estimate'
import { NotFoundError } from '../utils/errors'
import { estimateService } from './estimate.service'

/**
 * Сервис для работы с версиями сметы
 */
export class VersionService {
  /**
   * Получить все версии сметы
   */
  getVersionsByEstimateId(estimateId: string): VersionInfo[] {
    const versions = versionRepository.findByEstimateId(estimateId)
    return versions.map(v => ({
      id: v.id,
      versionNumber: v.version_number,
      name: v.name,
      createdAt: v.created_at,
    }))
  }

  /**
   * Получить версию по ID
   */
  getVersionById(estimateId: string, versionId: string): {
    id: string
    versionNumber: number
    name: string | null
    createdAt: string
    views: Array<{ id: string; name: string; sortOrder: number }>
    sections: Array<{
      id: string
      name: string
      sortOrder: number
      viewSettings: Record<string, { visible: boolean }>
      items: Array<{
        id: string
        number: string
        name: string
        unit: string
        quantity: number
        sortOrder: number
        viewSettings: Record<string, { price: number; total: number; visible: boolean }>
      }>
    }>
  } {
    const version = versionRepository.findById(versionId)
    if (!version || version.estimate_id !== estimateId) {
      throw new NotFoundError('Версия')
    }

    const sections = versionSectionRepository.findByVersionId(version.id)
    const items = versionItemRepository.findByVersionId(version.id)
    const views = versionViewRepository.findByVersionId(version.id)
    const viewSectionSettings =
      versionViewSectionSettingsRepository.findByVersionId(version.id)
    const viewItemSettings =
      versionViewItemSettingsRepository.findByVersionId(version.id)

    // Build view settings maps
    const sectionViewMap = new Map<
      string,
      Record<string, { visible: boolean }>
    >()
    for (const s of viewSectionSettings) {
      if (!sectionViewMap.has(s.version_section_id))
        sectionViewMap.set(s.version_section_id, {})
      sectionViewMap.get(s.version_section_id)![s.version_view_id] = {
        visible: Boolean(s.visible),
      }
    }
    const itemViewMap = new Map<
      string,
      Record<string, { price: number; total: number; visible: boolean }>
    >()
    for (const i of viewItemSettings) {
      if (!itemViewMap.has(i.version_item_id))
        itemViewMap.set(i.version_item_id, {})
      itemViewMap.get(i.version_item_id)![i.version_view_id] = {
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
        .filter(item => item.version_section_id === section.id)
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
      id: version.id,
      versionNumber: version.version_number,
      name: version.name,
      createdAt: version.created_at,
      views: views.map(v => ({ id: v.id, name: v.name, sortOrder: v.sort_order })),
      sections: sectionsWithItems,
    }
  }

  /**
   * Создать версию сметы
   */
  createVersion(estimateId: string, input: CreateVersionInput): VersionInfo {
    const maxVersion = versionRepository.getMaxVersionNumber(estimateId)
    const versionNumber = maxVersion + 1
    const versionId = uuidv4()
    versionRepository.create(versionId, estimateId, versionNumber, input.name || null)

    // Snapshot sections and items
    const sections = sectionRepository.findByEstimateId(estimateId)
    const items = itemRepository.findByEstimateId(estimateId)
    const views = viewRepository.findByEstimateId(estimateId)

    const sectionIdMap = new Map<string, string>() // original -> version
    const itemIdMap = new Map<string, string>() // original -> version

    for (const section of sections) {
      const versionSectionId = uuidv4()
      sectionIdMap.set(section.id, versionSectionId)
      versionSectionRepository.create(
        versionSectionId,
        versionId,
        section.id,
        section.name,
        section.sort_order
      )
    }

    for (const item of items) {
      const versionSectionId = sectionIdMap.get(item.section_id)
      if (!versionSectionId) continue
      const versionItemId = uuidv4()
      itemIdMap.set(item.id, versionItemId)
      versionItemRepository.create(
        versionItemId,
        versionId,
        versionSectionId,
        item.id,
        item.number,
        item.name,
        item.unit,
        item.quantity,
        item.sort_order
      )
    }

    // Snapshot views and their settings
    const viewIdMap = new Map<string, string>()
    for (const view of views) {
      const versionViewId = uuidv4()
      viewIdMap.set(view.id, versionViewId)
      versionViewRepository.create(
        versionViewId,
        versionId,
        view.id,
        view.name,
        view.sort_order
      )

      // Snapshot section settings
      const sectionSettings = viewSectionSettingsRepository.findByViewId(view.id)
      for (const ss of sectionSettings) {
        const vSectionId = sectionIdMap.get(ss.section_id)
        if (!vSectionId) continue
        versionViewSectionSettingsRepository.create(
          uuidv4(),
          versionId,
          versionViewId,
          vSectionId,
          Boolean(ss.visible)
        )
      }

      // Snapshot item settings
      const itemSettings = viewItemSettingsRepository.findByViewId(view.id)
      for (const is_ of itemSettings) {
        const vItemId = itemIdMap.get(is_.item_id)
        if (!vItemId) continue
        versionViewItemSettingsRepository.create(
          uuidv4(),
          versionId,
          versionViewId,
          vItemId,
          is_.price,
          is_.total,
          Boolean(is_.visible)
        )
      }
    }

    return {
      id: versionId,
      versionNumber,
      name: input.name || null,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Восстановить смету из версии
   */
  restoreVersion(estimateId: string, versionId: string): {
    message: string
    restoredFrom: { versionNumber: number; name: string | null }
  } {
    const version = versionRepository.findById(versionId)
    if (!version || version.estimate_id !== estimateId) {
      throw new NotFoundError('Версия')
    }

    // Get version data
    const versionSections = versionSectionRepository.findByVersionId(version.id)
    const versionItems = versionItemRepository.findByVersionId(version.id)
    const versionViews = versionViewRepository.findByVersionId(version.id)
    const versionViewSectionSettings =
      versionViewSectionSettingsRepository.findByVersionId(version.id)
    const versionViewItemSettings =
      versionViewItemSettingsRepository.findByVersionId(version.id)

    // Delete current data
    itemRepository.deleteByEstimateId(estimateId)
    sectionRepository.deleteByEstimateId(estimateId)
    // Views: delete all and recreate from version
    viewRepository.deleteByEstimateId(estimateId)

    // Restore views
    const viewIdMap = new Map<string, string>() // version_view_id -> new_view_id
    for (const vView of versionViews) {
      const newViewId = uuidv4()
      viewIdMap.set(vView.id, newViewId)
      viewRepository.create(
        newViewId,
        estimateId,
        vView.name,
        uuidv4(),
        null,
        vView.sort_order
      )
    }

    // Restore sections
    const sectionIdMap = new Map<string, string>() // version_section_id -> new_section_id
    for (const vSection of versionSections) {
      const newSectionId = uuidv4()
      sectionIdMap.set(vSection.id, newSectionId)
      sectionRepository.create(
        newSectionId,
        estimateId,
        vSection.name,
        vSection.sort_order
      )
    }

    // Restore items
    const itemIdMap = new Map<string, string>() // version_item_id -> new_item_id
    for (const vItem of versionItems) {
      const newSectionId = sectionIdMap.get(vItem.version_section_id)
      if (!newSectionId) continue
      const newItemId = uuidv4()
      itemIdMap.set(vItem.id, newItemId)
      itemRepository.create(
        newItemId,
        estimateId,
        newSectionId,
        vItem.number,
        vItem.name,
        vItem.unit,
        vItem.quantity,
        vItem.sort_order
      )
    }

    // Restore view section settings
    for (const vss of versionViewSectionSettings) {
      const newViewId = viewIdMap.get(vss.version_view_id)
      const newSectionId = sectionIdMap.get(vss.version_section_id)
      if (!newViewId || !newSectionId) continue
      viewSectionSettingsRepository.upsert(
        uuidv4(),
        newViewId,
        newSectionId,
        Boolean(vss.visible)
      )
    }

    // Restore view item settings
    for (const vis of versionViewItemSettings) {
      const newViewId = viewIdMap.get(vis.version_view_id)
      const newItemId = itemIdMap.get(vis.version_item_id)
      if (!newViewId || !newItemId) continue
      viewItemSettingsRepository.upsert(
        uuidv4(),
        newViewId,
        newItemId,
        vis.price,
        vis.total,
        Boolean(vis.visible)
      )
    }

    return {
      message: 'Смета восстановлена из версии',
      restoredFrom: {
        versionNumber: version.version_number,
        name: version.name,
      },
    }
  }
}

export const versionService = new VersionService()
