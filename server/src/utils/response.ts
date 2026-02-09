import { Response } from 'express'
import { ApiError, ApiSuccess } from '../types/common'

/**
 * Отправка успешного ответа
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json(data)
}

/**
 * Отправка ответа с ошибкой
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400
): Response {
  return res.status(statusCode).json({ error } as ApiError)
}

/**
 * Отправка ответа "создано" (201)
 */
export function sendCreated<T>(res: Response, data: T): Response {
  return res.status(201).json(data)
}

/**
 * Отправка ответа "без содержимого" (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send()
}

/**
 * Отправка ответа "не найдено" (404)
 */
export function sendNotFound(res: Response, resource: string = 'Ресурс'): Response {
  return res.status(404).json({ error: `${resource} не найден` } as ApiError)
}

/**
 * Отправка ответа "не авторизован" (401)
 */
export function sendUnauthorized(res: Response, message: string = 'Требуется авторизация'): Response {
  return res.status(401).json({ error: message } as ApiError)
}

/**
 * Отправка ответа "запрещено" (403)
 */
export function sendForbidden(res: Response, message: string = 'Доступ запрещен'): Response {
  return res.status(403).json({ error: message } as ApiError)
}

/**
 * Отправка ответа "конфликт" (409)
 */
export function sendConflict(res: Response, message: string): Response {
  return res.status(409).json({ error: message } as ApiError)
}

/**
 * Отправка ответа "внутренняя ошибка сервера" (500)
 */
export function sendInternalError(
  res: Response,
  message: string = 'Внутренняя ошибка сервера'
): Response {
  return res.status(500).json({ error: message } as ApiError)
}

