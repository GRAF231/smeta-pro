import { Response } from 'express'
import { AuthRequest } from '../types/common'
import { authService } from '../services/auth.service'
import { requireString, validateEmail, validatePassword } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { sendCreated, sendSuccess } from '../utils/response'

/**
 * Контроллер для обработки запросов аутентификации
 */
export class AuthController {
  /**
   * Регистрация пользователя
   */
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const email = validateEmail(requireString(req.body.email, 'Email'))
    const password = validatePassword(requireString(req.body.password, 'Пароль'))
    const name = requireString(req.body.name, 'Имя')

    const result = await authService.register({ email, password, name })
    sendCreated(res, result)
  })

  /**
   * Вход пользователя
   */
  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const email = requireString(req.body.email, 'Email')
    const password = requireString(req.body.password, 'Пароль')

    const result = await authService.login({ email, password })
    sendSuccess(res, result)
  })

  /**
   * Получить текущего пользователя
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = authService.getCurrentUser(req.user!.id)
    sendSuccess(res, { user })
  })
}

export const authController = new AuthController()

