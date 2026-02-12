import { intermediateDataQueries } from '../models/database'
import { IntermediateDataRow } from '../types/estimate'
import { v4 as uuidv4 } from 'uuid'

/**
 * Репозиторий для работы с промежуточными данными генерации
 */
export class IntermediateDataRepository {
  /**
   * Сохранить промежуточные данные
   */
  save(
    taskId: string,
    stage: string,
    dataType: string,
    data: any
  ): string {
    const id = uuidv4()
    const dataJson = typeof data === 'string' ? data : JSON.stringify(data)
    
    intermediateDataQueries.save.run(
      id,
      taskId,
      stage,
      dataType,
      dataJson
    )
    return id
  }

  /**
   * Получить данные по задаче и этапу
   */
  getByTaskAndStage(taskId: string, stage: string): IntermediateDataRow[] {
    return intermediateDataQueries.findByTaskAndStage.all(taskId, stage) as IntermediateDataRow[]
  }

  /**
   * Получить данные по задаче и типу
   */
  getByTaskAndType(taskId: string, dataType: string): IntermediateDataRow[] {
    return intermediateDataQueries.findByTaskAndType.all(taskId, dataType) as IntermediateDataRow[]
  }

  /**
   * Получить все данные задачи
   */
  getByTask(taskId: string): IntermediateDataRow[] {
    return intermediateDataQueries.findByTaskId.all(taskId) as IntermediateDataRow[]
  }

  /**
   * Получить данные по ID
   */
  findById(id: string): IntermediateDataRow | undefined {
    return intermediateDataQueries.findById.get(id) as IntermediateDataRow | undefined
  }

  /**
   * Удалить все данные задачи
   */
  deleteByTask(taskId: string): boolean {
    const result = intermediateDataQueries.deleteByTask.run(taskId)
    return result.changes > 0
  }

  /**
   * Парсить JSON данные из строки
   */
  parseData(row: IntermediateDataRow): any {
    try {
      return JSON.parse(row.data_json)
    } catch (error) {
      return null
    }
  }
}

export const intermediateDataRepository = new IntermediateDataRepository()

