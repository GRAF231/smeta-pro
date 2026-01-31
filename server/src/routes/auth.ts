import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { userQueries } from '../models/database'
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

interface UserRow {
  id: string
  email: string
  password_hash: string
  name: string
  role: string
  created_at: string
}

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Все поля обязательны' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' })
    }

    // Check if user exists
    const existingUser = userQueries.findByEmail.get(email) as UserRow | undefined
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    // Create user
    const id = uuidv4()
    const passwordHash = await bcrypt.hash(password, 10)
    
    userQueries.create.run(id, email, passwordHash, name, 'brigadir')

    const token = generateToken(id, email)

    res.status(201).json({
      token,
      user: { id, email, name, role: 'brigadir' }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Ошибка регистрации' })
  }
})

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' })
    }

    const user = userQueries.findByEmail.get(email) as UserRow | undefined
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    const token = generateToken(user.id, user.email)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Ошибка входа' })
  }
})

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user })
})

export default router

