/**
 * Пользователь из базы данных
 */
export interface UserRow {
  id: string
  email: string
  password_hash: string
  name: string
  role: string
  created_at: string
}

/**
 * Публичные данные пользователя (без пароля)
 */
export interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

/**
 * Данные для регистрации пользователя
 */
export interface RegisterInput {
  email: string
  password: string
  name: string
}

/**
 * Данные для входа пользователя
 */
export interface LoginInput {
  email: string
  password: string
}

/**
 * Ответ при успешной аутентификации
 */
export interface AuthResponse {
  token: string
  user: User
}

