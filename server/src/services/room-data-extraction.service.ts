import sharp from 'sharp'
import {
  detectImportantRegions,
  extractRoomData,
  extractMaterialBills,
  RoomExtractionResult,
  ImportantRegion,
  MaterialBill,
} from './openrouter'
import { pageClassificationService } from './page-classification.service'
import { roomDataRepository } from '../repositories/room-data.repository'
import { intermediateDataRepository } from '../repositories/intermediate-data.repository'

export interface RoomDataExtractionResult {
  roomName: string
  extractedData: RoomExtractionResult
  savedRoomDataId: string
  highQualityRegions: string[]
  materialBills: MaterialBill[]
  materialBillImages: string[]
}

/**
 * Сервис для извлечения данных по помещениям
 */
export class RoomDataExtractionService {
  /**
   * Вырезать область из изображения в высоком разрешении
   */
  private async extractRegion(
    pageImageDataUrl: string,
    region: ImportantRegion
  ): Promise<string> {
    // Extract base64 from data URL
    const base64Match = pageImageDataUrl.match(/^data:image\/[^;]+;base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid data URL format')
    }

    const imageBuffer = Buffer.from(base64Match[1], 'base64')

    // Get image metadata to calculate actual dimensions
    const metadata = await sharp(imageBuffer).metadata()
    const imageWidth = metadata.width || 1600
    const imageHeight = metadata.height || 0

    // Validate coordinates are within image bounds
    if (region.x < 0 || region.y < 0 || region.x + region.width > imageWidth || region.y + region.height > imageHeight) {
      console.warn(
        `[RoomDataExtraction] Region coordinates out of bounds: region(${region.x}, ${region.y}, ${region.width}x${region.height}) vs image(${imageWidth}x${imageHeight})`
      )
    }

    // Add padding around region (10% of width/height, minimum 20px)
    const horizontalPadding = Math.max(20, region.width * 0.1)
    const verticalPadding = Math.max(20, region.height * 0.1)

    const left = Math.max(0, Math.min(region.x - horizontalPadding, imageWidth - 1))
    const top = Math.max(0, Math.min(region.y - verticalPadding, imageHeight - 1))
    const width = Math.min(imageWidth - left, region.width + horizontalPadding * 2)
    const height = Math.min(imageHeight - top, region.height + verticalPadding * 2)

    console.log(
      `[RoomDataExtraction] Extracting region: region(${region.x}, ${region.y}, ${region.width}x${region.height}) image(${imageWidth}x${imageHeight}) -> crop: left=${left}, top=${top}, width=${width}, height=${height}`
    )

    // Extract region in high quality
    const regionBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
      })
      .jpeg({ quality: 95 }) // Very high quality for precise data extraction
      .toBuffer()

    return `data:image/jpeg;base64,${regionBuffer.toString('base64')}`
  }

  /**
   * Создать миниатюру страницы для контекста
   */
  private async createThumbnail(pageImageDataUrl: string): Promise<string> {
    const base64Match = pageImageDataUrl.match(/^data:image\/[^;]+;base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid data URL format')
    }

    const imageBuffer = Buffer.from(base64Match[1], 'base64')

    // Create thumbnail: resize to max 600px width, quality 70
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(600, null, { withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer()

    return `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`
  }

  /**
   * Создать оптимизированную версию изображения для обнаружения областей
   * Используется для получения координат, которые потом масштабируются обратно
   * ВАЖНО: Используем оригинальные изображения, но в более низком качестве для экономии токенов
   */
  private async createDetectionImage(
    pageImageDataUrl: string
  ): Promise<{ image: string; originalWidth: number; originalHeight: number; detectionWidth: number; detectionHeight: number }> {
    const base64Match = pageImageDataUrl.match(/^data:image\/[^;]+;base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid data URL format')
    }

    const imageBuffer = Buffer.from(base64Match[1], 'base64')
    
    // Get original dimensions FIRST
    const metadata = await sharp(imageBuffer).metadata()
    const originalWidth = metadata.width || 1600
    const originalHeight = metadata.height || 0

    // Create optimized version for detection: same size but lower quality to save tokens
    // This ensures coordinates match exactly with original image
    const detectionBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 70 }) // Lower quality for detection, but same dimensions
      .toBuffer()

    // Detection image has the SAME dimensions as original
    const detectionWidth = originalWidth
    const detectionHeight = originalHeight

    console.log(
      `[RoomDataExtraction] Created detection image: ${originalWidth}x${originalHeight} (same size, quality 70)`
    )

    return {
      image: `data:image/jpeg;base64,${detectionBuffer.toString('base64')}`,
      originalWidth,
      originalHeight,
      detectionWidth,
      detectionHeight,
    }
  }

  /**
   * Масштабировать координаты с изображения обнаружения на оригинальное изображение
   */
  private scaleRegionCoordinates(
    region: ImportantRegion,
    originalWidth: number,
    originalHeight: number,
    detectionWidth: number,
    detectionHeight: number
  ): ImportantRegion {
    const scaleX = originalWidth / detectionWidth
    const scaleY = originalHeight / detectionHeight

    return {
      ...region,
      x: Math.round(region.x * scaleX),
      y: Math.round(region.y * scaleY),
      width: Math.round(region.width * scaleX),
      height: Math.round(region.height * scaleY),
    }
  }

  /**
   * Извлечь данные помещения
   * @param taskId ID задачи генерации
   * @param roomName Название помещения
   * @returns Результат извлечения данных
   */
  async extractRoomData(
    taskId: string,
    roomName: string
  ): Promise<RoomDataExtractionResult> {
    console.log(`[RoomDataExtraction] Starting extraction for room "${roomName}"`)

    // Step 1: Get all pages related to this room
    const roomPages = pageClassificationService.getByRoom(taskId, roomName)
    if (roomPages.length === 0) {
      throw new Error(`Не найдено страниц для помещения "${roomName}"`)
    }

    console.log(`[RoomDataExtraction] Found ${roomPages.length} pages for room "${roomName}"`)

    // Step 2: Get full-size page images
    const fullPageImages: string[] = []
    for (const page of roomPages) {
      if (page.image_data_url) {
        fullPageImages.push(page.image_data_url)
      }
    }

    if (fullPageImages.length === 0) {
      throw new Error(`Не найдено изображений для помещения "${roomName}"`)
    }

    // Step 3: Create optimized images for detection (to get accurate coordinates)
    console.log(`[RoomDataExtraction] Creating detection images for ${fullPageImages.length} pages...`)
    const detectionImages: Array<{
      image: string
      originalWidth: number
      originalHeight: number
      detectionWidth: number
      detectionHeight: number
    }> = []
    
    for (const pageImage of fullPageImages) {
      try {
        const detectionImage = await this.createDetectionImage(pageImage)
        detectionImages.push(detectionImage)
      } catch (error) {
        console.error('[RoomDataExtraction] Error creating detection image:', error)
        // Fallback: use original image with assumed dimensions
        detectionImages.push({
          image: pageImage,
          originalWidth: 1600,
          originalHeight: 2200,
          detectionWidth: 1600,
          detectionHeight: 2200,
        })
      }
    }

    // Step 3.5: Detect important regions using detection images
    console.log(`[RoomDataExtraction] Detecting important regions on ${detectionImages.length} pages...`)
    const detectionImageUrls = detectionImages.map((d) => d.image)
    const imageDimensions = detectionImages.map((d) => ({
      width: d.detectionWidth,
      height: d.detectionHeight,
    }))
    const regionsInfo = await detectImportantRegions(detectionImageUrls, imageDimensions)

    // Step 4: Scale coordinates back to original images and extract high-quality regions
    const highQualityRegions: string[] = []
    const materialBillRegions: string[] = [] // Tables with material bills
    
    for (const pageInfo of regionsInfo) {
      const pageIndex = pageInfo.pageIndex
      if (pageIndex < 0 || pageIndex >= fullPageImages.length) {
        console.warn(`[RoomDataExtraction] Invalid page index: ${pageIndex}`)
        continue
      }

      const pageImage = fullPageImages[pageIndex]
      const detectionImage = detectionImages[pageIndex]

      for (const region of pageInfo.regions) {
        try {
          // Adjust coordinates: AI tends to detect regions shifted to the left and up
          // Add offset to x coordinate to shift right (approximately half width of image)
          // Add offset to y coordinate to shift down (10% of image height)
          const xOffsetPercent = 0.5 // 50% shift to the right
          const yOffsetPercent = 0.1 // 10% shift down
          const xOffset = Math.round(detectionImage.detectionWidth * xOffsetPercent)
          const yOffset = Math.round(detectionImage.detectionHeight * yOffsetPercent)
          
          // Calculate adjusted x coordinate, ensuring it doesn't exceed image bounds
          const adjustedX = Math.min(
            region.x + xOffset,
            detectionImage.detectionWidth - region.width // Don't go beyond image width
          )
          
          // Calculate adjusted y coordinate, ensuring it doesn't exceed image bounds
          const adjustedY = Math.min(
            region.y + yOffset,
            detectionImage.detectionHeight - region.height // Don't go beyond image height
          )
          
          const adjustedRegion: ImportantRegion = {
            ...region,
            x: Math.max(0, adjustedX), // Ensure x is not negative
            y: Math.max(0, adjustedY), // Ensure y is not negative
          }
          
          // Since detection image has same dimensions as original, no scaling needed
          // But verify dimensions match
          if (
            Math.abs(detectionImage.originalWidth - detectionImage.detectionWidth) > 1 ||
            Math.abs(detectionImage.originalHeight - detectionImage.detectionHeight) > 1
          ) {
            // Only scale if dimensions differ (shouldn't happen now, but just in case)
            const scaledRegion = this.scaleRegionCoordinates(
              adjustedRegion,
              detectionImage.originalWidth,
              detectionImage.originalHeight,
              detectionImage.detectionWidth,
              detectionImage.detectionHeight
            )
            console.log(
              `[RoomDataExtraction] Adjusted and scaled region: original (${region.x}, ${region.y}, ${region.width}x${region.height}) -> adjusted (${adjustedRegion.x}, ${adjustedRegion.y}, offset x=${xOffset}px y=${yOffset}px) -> scaled (${scaledRegion.x}, ${scaledRegion.y}, ${scaledRegion.width}x${scaledRegion.height})`
            )
            const regionImage = await this.extractRegion(pageImage, scaledRegion)
            highQualityRegions.push(regionImage)
          } else {
            // Use adjusted coordinates directly - same dimensions
            console.log(
              `[RoomDataExtraction] Using adjusted coordinates: original (${region.x}, ${region.y}, ${region.width}x${region.height}) -> adjusted (${adjustedRegion.x}, ${adjustedRegion.y}, ${adjustedRegion.width}x${adjustedRegion.height}), offset x=${xOffset}px y=${yOffset}px`
            )
            const regionImage = await this.extractRegion(pageImage, adjustedRegion)
            highQualityRegions.push(regionImage)
          }
          
          // Separate material bill tables for special processing
          if (region.type === 'table' && (
            region.description.toLowerCase().includes('ведомость') ||
            region.description.toLowerCase().includes('материал') ||
            region.description.toLowerCase().includes('спецификац')
          )) {
            materialBillRegions.push(highQualityRegions[highQualityRegions.length - 1])
            console.log(
              `[RoomDataExtraction] Found material bill table: ${region.description}`
            )
          } else {
            console.log(
              `[RoomDataExtraction] Extracted ${region.type} region: ${region.description}`
            )
          }
        } catch (error) {
          console.error(
            `[RoomDataExtraction] Error extracting region from page ${pageIndex + 1}:`,
            error
          )
        }
      }
    }

    // Step 4.5: Extract data from material bill tables FIRST (most important!)
    let materialBills: MaterialBill[] = []
    if (materialBillRegions.length > 0) {
      console.log(
        `[RoomDataExtraction] Extracting material bills from ${materialBillRegions.length} tables...`
      )
      try {
        materialBills = await extractMaterialBills(materialBillRegions)
        console.log(
          `[RoomDataExtraction] Extracted ${materialBills.length} material bills with ${materialBills.reduce((sum, bill) => sum + bill.items.length, 0)} total items`
        )
        
        // Save material bills to intermediate data
        intermediateDataRepository.save(
          taskId,
          'stage_4',
          'material_bills',
          {
            roomName,
            materialBills,
          }
        )
      } catch (error) {
        console.error('[RoomDataExtraction] Error extracting material bills:', error)
        // Continue even if material bill extraction fails
      }
    }

    // Step 5: Create thumbnails of full pages for context
    const thumbnails: string[] = []
    for (const pageImage of fullPageImages) {
      try {
        const thumbnail = await this.createThumbnail(pageImage)
        thumbnails.push(thumbnail)
      } catch (error) {
        console.error('[RoomDataExtraction] Error creating thumbnail:', error)
        // Use original if thumbnail creation fails
        thumbnails.push(pageImage)
      }
    }

    // Step 6: Extract room data using AI
    console.log(
      `[RoomDataExtraction] Extracting data: ${thumbnails.length} thumbnails, ${highQualityRegions.length} high-quality regions`
    )
    const extractedData = await extractRoomData(roomName, thumbnails, highQualityRegions)

    // Step 7: Get existing room data from DB (to preserve area, wallArea, etc.)
    const existingRoomData = roomDataRepository.getByTaskAndRoom(taskId, roomName)

    // Step 8: Calculate areas programmatically if not extracted
    // Use existing area from structure analysis if available
    const area = existingRoomData?.area || extractedData.dimensions?.area || null
    const wallArea = existingRoomData?.wall_area || null // Will be calculated later from plans
    const floorArea = existingRoomData?.floor_area || area || null
    const ceilingArea = existingRoomData?.ceiling_area || area || null

    // Step 9: Save extracted data to DB
    const roomDataId = roomDataRepository.saveRoomData(
      taskId,
      roomName,
      extractedData,
      existingRoomData?.room_type || null,
      area,
      wallArea,
      floorArea,
      ceilingArea
    )

    // Step 10: Save to intermediate data
    intermediateDataRepository.save(
      taskId,
      'stage_4',
      'room_data',
      {
        roomName,
        extractedData,
      }
    )

    console.log(
      `[RoomDataExtraction] Successfully extracted data for room "${roomName}": ${extractedData.wallMaterials.length} wall materials, ${extractedData.openings.length} openings`
    )

    return {
      roomName,
      extractedData,
      savedRoomDataId: roomDataId,
      highQualityRegions,
      materialBills,
      materialBillImages: materialBillRegions,
    }
  }

  /**
   * Извлечь данные для всех помещений задачи
   * @param taskId ID задачи генерации
   * @returns Результаты извлечения для всех помещений
   */
  async extractAllRoomsData(taskId: string): Promise<RoomDataExtractionResult[]> {
    // Get all rooms from structure analysis
    const rooms = roomDataRepository.getByTask(taskId)
    if (rooms.length === 0) {
      throw new Error('Не найдено помещений для извлечения данных')
    }

    console.log(`[RoomDataExtraction] Extracting data for ${rooms.length} rooms...`)

    const results: RoomDataExtractionResult[] = []

    // Process rooms sequentially to avoid overwhelming the API
    for (const room of rooms) {
      try {
        const result = await this.extractRoomData(taskId, room.room_name)
        results.push(result)
        console.log(
          `[RoomDataExtraction] Completed ${results.length}/${rooms.length} rooms`
        )
      } catch (error) {
        console.error(
          `[RoomDataExtraction] Error extracting data for room "${room.room_name}":`,
          error
        )
        // Continue with other rooms even if one fails
      }
    }

    return results
  }

  /**
   * Получить извлеченные данные помещения
   */
  getRoomData(taskId: string, roomName: string) {
    return roomDataRepository.getByTaskAndRoom(taskId, roomName)
  }

  /**
   * Получить все извлеченные данные задачи
   */
  getAllRoomsData(taskId: string) {
    return roomDataRepository.getByTask(taskId)
  }
}

export const roomDataExtractionService = new RoomDataExtractionService()

