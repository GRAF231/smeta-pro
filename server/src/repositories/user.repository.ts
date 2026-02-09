import { Statement } from 'better-sqlite3'
import { db, userQueries } from '../models/database'
import { UserRow, User } from '../types/user'

/**
 * Репозиторий для работы с пользователями
 */
export class UserRepository {
  /**
   * Найти пользователя по email
   */
  findByEmail(email: string): UserRow | undefined {
    return userQueries.findByEmail.get(email) as UserRow | undefined
  }

  /**
   * Найти пользователя по ID (без пароля)
   */
  findById(id: string): User | undefined {
    const row = userQueries.findById.get(id) as {
      id: string
      email: string
      name: string
      role: string
      created_at: string
    } | undefined

    if (!row) return undefined

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at,
    }
  }

  /**
   * Создать пользователя
   */
  create(
    id: string,
    email: string,
    passwordHash: string,
    name: string,
    role: string = 'brigadir'
  ): void {
    userQueries.create.run(id, email, passwordHash, name, role)
  }

  /**
   * Получить полную информацию о пользователе по ID (с паролем)
   */
  findByIdWithPassword(id: string): UserRow | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    return stmt.get(id) as UserRow | undefined
  }
}

export const userRepository = new UserRepository()

