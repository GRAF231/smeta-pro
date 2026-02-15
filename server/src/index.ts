// Загружаем переменные окружения ПЕРВЫМ делом, до всех импортов
import dotenv from 'dotenv'
import path from 'path'

// Определяем путь к .env файлу
// Пробуем несколько возможных путей:
// 1. Относительно текущей директории (server/.env)
// 2. Относительно __dirname (для скомпилированного кода)
// 3. В корне проекта (fallback)
const possiblePaths = [
  path.join(__dirname, '../.env'),  // server/.env от dist/ или src/
  path.join(process.cwd(), 'server/.env'),  // server/.env от корня проекта
  path.join(process.cwd(), '.env'),  // .env в корне проекта
]

let envLoaded = false
for (const envPath of possiblePaths) {
  const result = dotenv.config({ path: envPath })
  if (!result.error) {
    console.log('✅ Loaded .env file from:', envPath)
    envLoaded = true
    
    // Проверяем наличие ключевых переменных
    const yookassaShopId = process.env.YOOKASSA_SHOP_ID
    const yookassaSecretKey = process.env.YOOKASSA_SECRET_KEY
    if (yookassaShopId && yookassaSecretKey) {
      console.log('✅ YooKassa env vars found:', {
        YOOKASSA_SHOP_ID: yookassaShopId.substring(0, 8) + '...',
        YOOKASSA_SECRET_KEY: yookassaSecretKey.substring(0, 8) + '...',
      })
    } else {
      console.warn('⚠️  YooKassa env vars not found in .env file')
    }
    break
  }
}

if (!envLoaded) {
  console.warn('⚠️  Could not load .env file from any of these paths:')
  possiblePaths.forEach(p => console.warn('   -', p))
  console.warn('   Make sure .env file exists in server/ directory')
}

import express from 'express'
import cors from 'cors'
import { initDatabase } from './config/database'
import authRoutes from './routes/auth.routes'
import estimateRoutes from './routes/estimate.routes'
import materialRoutes from './routes/material.routes'
import yookassaRoutes from './routes/yookassa.routes'
import { errorHandler } from './middleware/errorHandler'

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
app.use('/api/yookassa', yookassaRoutes)

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
