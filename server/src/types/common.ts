import { Request } from 'express'

/**
 * Расширенный Request с информацией о пользователе
 */
export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

/**
 * Полезная нагрузка JWT токена
 */
export interface JwtPayload {
  userId: string
  email: string
}

/**
 * Стандартный ответ API с ошибкой
 */
export interface ApiError {
  error: string
}

/**
 * Стандартный ответ API с успехом
 */
export interface ApiSuccess<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

