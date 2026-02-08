import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { initDatabase } from './models/database'
import authRoutes from './routes/auth'
import estimatesRoutes from './routes/estimates'
import materialsRoutes from './routes/materials'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const isProduction = process.env.NODE_ENV === 'production'

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Initialize database
initDatabase()

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/estimates', estimatesRoutes)
app.use('/api/estimates/:estimateId/materials', materialsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve frontend in production
if (isProduction) {
  const clientDistPath = path.join(__dirname, '../../client/dist')
  
  // Serve static files
  app.use(express.static(clientDistPath))
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  if (isProduction) {
    console.log(`📦 Serving frontend from client/dist`)
  }
})
