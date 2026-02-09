/**
 * Базовый класс для ошибок приложения
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Ошибка валидации (400)
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

/**
 * Ошибка авторизации (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Требуется авторизация') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

/**
 * Ошибка доступа (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Доступ запрещен') {
    super(message, 403, 'FORBIDDEN')
  }
}

/**
 * Ошибка "не найдено" (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Ресурс') {
    super(`${resource} не найден`, 404, 'NOT_FOUND')
  }
}

/**
 * Ошибка конфликта (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

/**
 * Проверка, является ли ошибка экземпляром AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Преобразование ошибки в формат для ответа API
 */
export function formatError(error: unknown): { error: string; code?: string } {
  if (isAppError(error)) {
    return {
      error: error.message,
      code: error.code,
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
    }
  }

  return {
    error: 'Внутренняя ошибка сервера',
  }
}

