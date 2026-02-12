import { extractedRoomDataQueries } from '../models/database'
import { ExtractedRoomDataRow } from '../types/estimate'
import { v4 as uuidv4 } from 'uuid'

/**
 * Репозиторий для работы с извлеченными данными помещений
 */
export class RoomDataRepository {
  /**
   * Сохранить данные помещения
   */
  saveRoomData(
    taskId: string,
    roomName: string,
    extractedData: any,
    roomType: string | null = null,
    area: number | null = null,
    wallArea: number | null = null,
    floorArea: number | null = null,
    ceilingArea: number | null = null
  ): string {
    const id = uuidv4()
    const extractedDataJson = typeof extractedData === 'string' 
      ? extractedData 
      : JSON.stringify(extractedData)
    
    extractedRoomDataQueries.saveRoomData.run(
      id,
      taskId,
      roomName,
      roomType,
      area,
      wallArea,
      floorArea,
      ceilingArea,
      extractedDataJson
    )
    return id
  }

  /**
   * Получить все помещения задачи
   */
  getByTask(taskId: string): ExtractedRoomDataRow[] {
    return extractedRoomDataQueries.findByTaskId.all(taskId) as ExtractedRoomDataRow[]
  }

  /**
   * Получить данные конкретного помещения
   */
  getByTaskAndRoom(taskId: string, roomName: string): ExtractedRoomDataRow | undefined {
    return extractedRoomDataQueries.findByTaskAndRoom.get(taskId, roomName) as ExtractedRoomDataRow | undefined
  }

  /**
   * Получить данные по ID
   */
  findById(id: string): ExtractedRoomDataRow | undefined {
    return extractedRoomDataQueries.findById.get(id) as ExtractedRoomDataRow | undefined
  }

  /**
   * Удалить все данные задачи
   */
  deleteByTask(taskId: string): boolean {
    const result = extractedRoomDataQueries.deleteByTask.run(taskId)
    return result.changes > 0
  }

  /**
   * Парсить JSON данные из строки
   */
  parseExtractedData(row: ExtractedRoomDataRow): any {
    try {
      return JSON.parse(row.extracted_data_json)
    } catch (error) {
      return null
    }
  }
}

export const roomDataRepository = new RoomDataRepository()

