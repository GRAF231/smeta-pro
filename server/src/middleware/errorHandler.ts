import { Request, Response, NextFunction } from 'express'
import { AppError, formatError, isAppError } from '../utils/errors'

/**
 * Middleware для обработки ошибок
 * Должен быть последним в цепочке middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Если ответ уже отправлен, передаем ошибку стандартному обработчику Express
  if (res.headersSent) {
    return next(err)
  }

  // Логируем ошибку
  console.error('Error:', err.message)
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error('Stack:', err.stack)
  }

  // Форматируем ошибку для клиента
  const errorResponse = formatError(err)

  // Определяем статус код
  const statusCode = isAppError(err) ? err.statusCode : 500

  // Отправляем ответ
  res.status(statusCode).json(errorResponse)
}

/**
 * Wrapper для асинхронных обработчиков маршрутов
 * Автоматически ловит ошибки и передает их в errorHandler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

