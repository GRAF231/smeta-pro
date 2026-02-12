import {
  analyzeProjectStructure,
  analyzeProjectStructureFromTables,
  detectTablesOnPlans,
  ProjectStructure,
  PlanTableInfo,
} from './openrouter'
import { pageClassificationService } from './page-classification.service'
import { intermediateDataRepository } from '../repositories/intermediate-data.repository'
import { roomDataRepository } from '../repositories/room-data.repository'
import sharp from 'sharp'

export interface StructureAnalysisResult {
  structure: ProjectStructure
  savedRoomData: Array<{
    id: string
    room_name: string
    room_type: string | null
    area: number | null
  }>
}

/**
 * Сервис для анализа структуры проекта
 */
export class StructureAnalysisService {
  /**
   * Вырезать область таблицы из изображения плана
   */
  private async extractTableRegion(
    planImageDataUrl: string,
    tableInfo: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    // Extract base64 from data URL
    const base64Match = planImageDataUrl.match(/^data:image\/[^;]+;base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid data URL format')
    }

    const imageBuffer = Buffer.from(base64Match[1], 'base64')
    
    // Get image metadata to calculate actual dimensions
    const metadata = await sharp(imageBuffer).metadata()
    const imageWidth = metadata.width || 1600
    const imageHeight = metadata.height || 0

    // Calculate crop coordinates with asymmetric padding
    // Much smaller top padding, much larger bottom padding to ensure we capture the entire table including footer
    const horizontalPadding = Math.max(20, tableInfo.width * 0.08) // 8% of width or at least 20px
    const topPadding = Math.max(10, tableInfo.height * 0.02) // Very small top padding: 2% or at least 10px
    const bottomPadding = Math.max(150, tableInfo.height * 0.5) // Very large bottom padding: 50% or at least 150px to capture footer
    
    // Expand width to ensure we capture all columns (especially the area column on the right)
    const expandedWidth = tableInfo.width * 1.5 // Add 50% to width to capture all columns
    // Expand height significantly on bottom to capture footer row with total area
    // Use tableInfo.y + tableInfo.height as base, then add bottomPadding
    const tableBottom = tableInfo.y + tableInfo.height
    const expandedHeight = tableBottom - tableInfo.y + bottomPadding
    
    const left = Math.max(0, tableInfo.x - horizontalPadding)
    const top = Math.max(0, tableInfo.y - topPadding)
    const width = Math.min(imageWidth - left, expandedWidth + horizontalPadding * 2)
    const height = Math.min(imageHeight - top, expandedHeight + topPadding)

    console.log(
      `[StructureAnalysis] Extracting table: x=${tableInfo.x}, y=${tableInfo.y}, w=${tableInfo.width}, h=${tableInfo.height} -> crop: left=${left}, top=${top}, width=${width}, height=${height}`
    )

    // Extract table region in high quality
    const tableBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
      })
      .jpeg({ quality: 95 }) // Very high quality for table reading
      .toBuffer()

    return `data:image/jpeg;base64,${tableBuffer.toString('base64')}`
  }

  /**
   * Проанализировать структуру проекта с использованием таблиц
   * @param taskId ID задачи генерации
   * @param titlePages Массив data URLs титульных страниц (опционально)
   * @param planPages Массив data URLs планов помещений (полноразмерные изображения)
   * @returns Результат анализа структуры
   */
  async analyzeProjectStructure(
    taskId: string,
    titlePages: string[] = [],
    planPages: string[]
  ): Promise<StructureAnalysisResult & { tableImages?: string[] }> {
    if (planPages.length === 0) {
      throw new Error('Необходимо предоставить хотя бы один план')
    }

    console.log(
      `[StructureAnalysis] Starting analysis for task ${taskId}: ${titlePages.length} title pages, ${planPages.length} plan pages`
    )

    // Step 1: Detect tables on plans
    console.log(`[StructureAnalysis] Detecting tables on ${planPages.length} plans...`)
    const tableInfos = await detectTablesOnPlans(planPages)

    if (tableInfos.length === 0 || tableInfos.every((info) => info.tables.length === 0)) {
      console.log('[StructureAnalysis] No tables detected, falling back to full page analysis')
      // Fallback to old method if no tables detected
      const structure = await analyzeProjectStructure(titlePages, planPages)
      return {
        structure,
        savedRoomData: [],
      }
    }

    console.log(
      `[StructureAnalysis] Detected ${tableInfos.reduce((sum, info) => sum + info.tables.length, 0)} tables on ${tableInfos.length} plans`
    )

    // Step 2: Extract table regions in high quality
    const tableImages: string[] = []
    const planTypes: string[] = []

    for (const tableInfo of tableInfos) {
      if (tableInfo.tables.length === 0) continue

      const planIndex = tableInfo.planIndex
      if (planIndex < 0 || planIndex >= planPages.length) {
        console.warn(`[StructureAnalysis] Invalid plan index: ${planIndex}`)
        continue
      }

      const planImage = planPages[planIndex]

      for (const table of tableInfo.tables) {
        try {
          const tableImage = await this.extractTableRegion(planImage, table)
          tableImages.push(tableImage)
          planTypes.push(tableInfo.planType)
          console.log(
            `[StructureAnalysis] Extracted table from plan ${planIndex + 1}: ${table.width}x${table.height}px`
          )
        } catch (error) {
          console.error(
            `[StructureAnalysis] Error extracting table from plan ${planIndex + 1}:`,
            error
          )
        }
      }
    }

    if (tableImages.length === 0) {
      throw new Error('Не удалось извлечь таблицы из планов')
    }

    console.log(`[StructureAnalysis] Extracted ${tableImages.length} table images`)

    // Step 3: Analyze structure from tables only
    const structure = await analyzeProjectStructureFromTables(
      titlePages,
      tableImages,
      planTypes
    )

    console.log(
      `[StructureAnalysis] AI extracted ${structure.rooms.length} rooms from ${structure.planTypes.length} plan types`
    )

    // Step 3: Save structure to intermediate data
    intermediateDataRepository.save(
      taskId,
      'stage_3',
      'project_structure',
      structure
    )

    // Step 4: Save room data to database
    const savedRoomData: Array<{
      id: string
      room_name: string
      room_type: string | null
      area: number | null
    }> = []

    for (const room of structure.rooms) {
      const roomId = roomDataRepository.saveRoomData(
        taskId,
        room.name,
        {
          planType: room.planType,
          source: room.source,
        },
        room.type,
        room.area,
        null, // wallArea - будет заполнено позже
        room.area, // floorArea - используем площадь как площадь пола
        null // ceilingArea - будет заполнено позже
      )

      savedRoomData.push({
        id: roomId,
        room_name: room.name,
        room_type: room.type,
        area: room.area,
      })
    }

    console.log(
      `[StructureAnalysis] Saved ${savedRoomData.length} rooms to database`
    )

    return {
      structure,
      savedRoomData,
      tableImages, // Return table images for debugging
    }
  }

  /**
   * Получить структуру проекта из промежуточных данных
   */
  getProjectStructure(taskId: string): ProjectStructure | null {
    const intermediateData = intermediateDataRepository.getByTaskAndType(
      taskId,
      'project_structure'
    )

    if (intermediateData.length === 0) {
      return null
    }

    // Get the most recent structure data
    const latest = intermediateData[intermediateData.length - 1]
    return intermediateDataRepository.parseData(latest) as ProjectStructure
  }

  /**
   * Получить все помещения задачи
   */
  getRooms(taskId: string) {
    return roomDataRepository.getByTask(taskId)
  }
}

export const structureAnalysisService = new StructureAnalysisService()

