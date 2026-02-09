import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { initDatabase } from './config/database'
import authRoutes from './routes/auth.routes'
import estimateRoutes from './routes/estimate.routes'
import materialRoutes from './routes/material.routes'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const isProduction = process.env.NODE_ENV === 'production'

// Initialize database
initDatabase()

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', estimateRoutes)
app.use('/api/projects/:projectId/materials', materialRoutes)

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

// Error handler (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  if (isProduction) {
    console.log(`📦 Serving frontend from client/dist`)
  }
})
