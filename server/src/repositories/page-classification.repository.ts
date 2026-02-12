import { pageClassificationQueries } from '../models/database'
import { PageClassificationRow } from '../types/estimate'
import { v4 as uuidv4 } from 'uuid'

/**
 * Репозиторий для работы с классификацией страниц PDF
 */
export class PageClassificationRepository {
  /**
   * Сохранить классификацию страницы
   */
  saveClassification(
    taskId: string,
    pageNumber: number,
    pageType: 'plan' | 'wall_layout' | 'specification' | 'visualization' | 'other',
    roomName: string | null = null,
    imageDataUrl: string | null = null
  ): string {
    const id = uuidv4()
    pageClassificationQueries.saveClassification.run(
      id,
      taskId,
      pageNumber,
      pageType,
      roomName,
      imageDataUrl
    )
    return id
  }

  /**
   * Получить все классификации задачи
   */
  getByTask(taskId: string): PageClassificationRow[] {
    return pageClassificationQueries.findByTaskId.all(taskId) as PageClassificationRow[]
  }

  /**
   * Получить страницы определенного типа
   */
  getByTaskAndType(
    taskId: string,
    pageType: 'plan' | 'wall_layout' | 'specification' | 'visualization' | 'other'
  ): PageClassificationRow[] {
    return pageClassificationQueries.findByTaskAndType.all(taskId, pageType) as PageClassificationRow[]
  }

  /**
   * Получить страницы помещения
   */
  getByTaskAndRoom(taskId: string, roomName: string): PageClassificationRow[] {
    return pageClassificationQueries.findByTaskAndRoom.all(taskId, roomName) as PageClassificationRow[]
  }

  /**
   * Получить классификацию по ID
   */
  findById(id: string): PageClassificationRow | undefined {
    return pageClassificationQueries.findById.get(id) as PageClassificationRow | undefined
  }

  /**
   * Удалить все классификации задачи
   */
  deleteByTask(taskId: string): boolean {
    const result = pageClassificationQueries.deleteByTask.run(taskId)
    return result.changes > 0
  }
}

export const pageClassificationRepository = new PageClassificationRepository()

