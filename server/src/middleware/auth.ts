import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { userQueries } from '../models/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface JwtPayload {
  userId: string
  email: string
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verifyToken(token)
    const user = userQueries.findById.get(decoded.userId) as {
      id: string
      email: string
      name: string
      role: string
    } | undefined

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' })
  }
}

