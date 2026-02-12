import { generationTaskQueries } from '../models/database'
import { GenerationTaskRow } from '../types/estimate'
import { v4 as uuidv4 } from 'uuid'

/**
 * Репозиторий для работы с задачами генерации смет
 */
export class GenerationTaskRepository {
  /**
   * Создать задачу генерации
   */
  create(
    userId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending',
    stage: string | null = null,
    progressPercent: number = 0,
    estimateId: string | null = null,
    errorMessage: string | null = null
  ): string {
    const id = uuidv4()
    generationTaskQueries.create.run(
      id,
      estimateId,
      userId,
      status,
      stage,
      progressPercent,
      errorMessage
    )
    return id
  }

  /**
   * Обновить статус задачи
   */
  updateStatus(
    taskId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    stage: string | null,
    progressPercent: number
  ): boolean {
    const result = generationTaskQueries.updateStatus.run(
      status,
      stage,
      progressPercent,
      taskId
    )
    return result.changes > 0
  }

  /**
   * Получить задачу по ID
   */
  findById(taskId: string): GenerationTaskRow | undefined {
    return generationTaskQueries.findById.get(taskId) as GenerationTaskRow | undefined
  }

  /**
   * Получить все задачи пользователя
   */
  findByUserId(userId: string): GenerationTaskRow[] {
    return generationTaskQueries.findByUserId.all(userId) as GenerationTaskRow[]
  }

  /**
   * Получить задачи по estimate_id
   */
  findByEstimateId(estimateId: string): GenerationTaskRow[] {
    return generationTaskQueries.findByEstimateId.all(estimateId) as GenerationTaskRow[]
  }

  /**
   * Установить ошибку задачи
   */
  setError(taskId: string, errorMessage: string): boolean {
    const result = generationTaskQueries.setError.run(errorMessage, taskId)
    return result.changes > 0
  }

  /**
   * Завершить задачу
   */
  complete(taskId: string, estimateId: string): boolean {
    const result = generationTaskQueries.complete.run(estimateId, taskId)
    return result.changes > 0
  }
}

export const generationTaskRepository = new GenerationTaskRepository()

