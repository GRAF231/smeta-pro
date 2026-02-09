import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { userRepository } from '../repositories/user.repository'
import { generateToken } from '../middleware/auth'
import { User, RegisterInput, LoginInput, AuthResponse } from '../types/user'
import { ConflictError, UnauthorizedError } from '../utils/errors'

/**
 * Сервис для работы с аутентификацией пользователей
 */
export class AuthService {
  /**
   * Регистрация нового пользователя
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = userRepository.findByEmail(input.email)
    if (existingUser) {
      throw new ConflictError('Пользователь с таким email уже существует')
    }

    // Create user
    const id = uuidv4()
    const passwordHash = await bcrypt.hash(input.password, 10)
    
    userRepository.create(id, input.email, passwordHash, input.name, 'brigadir')

    const token = generateToken(id, input.email)

    return {
      token,
      user: {
        id,
        email: input.email,
        name: input.name,
        role: 'brigadir',
        createdAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Вход пользователя
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const user = userRepository.findByEmail(input.email)
    if (!user) {
      throw new UnauthorizedError('Неверный email или пароль')
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password_hash)
    if (!isValidPassword) {
      throw new UnauthorizedError('Неверный email или пароль')
    }

    const token = generateToken(user.id, user.email)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      },
    }
  }

  /**
   * Получить текущего пользователя
   */
  getCurrentUser(userId: string): User | null {
    return userRepository.findById(userId) || null
  }
}

export const authService = new AuthService()

