import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './models/database'
import authRoutes from './routes/auth'
import estimatesRoutes from './routes/estimates'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initDatabase()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/estimates', estimatesRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

