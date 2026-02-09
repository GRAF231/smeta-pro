/**
 * Материал из базы данных
 */
export interface MaterialRow {
  id: string
  estimate_id: string
  name: string
  article: string
  brand: string
  unit: string
  price: number
  quantity: number
  total: number
  url: string
  description: string
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * Материал (DTO)
 */
export interface Material {
  id: string
  estimateId: string
  name: string
  article: string
  brand: string
  unit: string
  price: number
  quantity: number
  total: number
  url: string
  description: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * Данные для парсинга материалов из URL
 */
export interface ParseMaterialsInput {
  urls: string[]
}

/**
 * Данные для обновления материала
 */
export interface UpdateMaterialInput {
  name?: string
  article?: string
  brand?: string
  unit?: string
  price?: number
  quantity?: number
  url?: string
  description?: string
}

/**
 * Результат обновления материалов
 */
export interface RefreshMaterialsResult {
  message: string
  updated: number
  materials: Material[]
}

