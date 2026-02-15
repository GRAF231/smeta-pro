import { Router } from 'express'
import { yookassaController } from '../controllers/yookassa.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Webhook endpoint (не требует аутентификации, но проверяет подпись)
router.post('/webhook', yookassaController.handleWebhook)

// Configuration check (требует аутентификации)
router.use(authMiddleware)
router.get('/config', yookassaController.checkConfiguration)

export default router

