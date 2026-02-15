import { Request, Response } from 'express'
import { AuthRequest } from '../types/common'
import { yookassaService } from '../services/yookassa.service'
import { paymentService } from '../services/payment.service'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess } from '../utils/response'

/**
 * Контроллер для обработки webhook от ЮKassa
 */
export class YookassaController {
  /**
   * Обработка webhook от ЮKassa
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    console.log('=== Received YooKassa webhook ===')
    console.log('Headers:', JSON.stringify(req.headers, null, 2))
    console.log('Body:', JSON.stringify(req.body, null, 2))
    
    const signature = req.headers['x-yoomoney-signature'] as string
    const notification = JSON.stringify(req.body)

    // Проверить подпись (в production обязательно)
    if (process.env.NODE_ENV === 'production') {
      if (!signature) {
        console.error('Missing webhook signature')
        throw new Error('Missing webhook signature')
      }

      const isValid = yookassaService.verifyWebhookSignature(notification, signature)
      if (!isValid) {
        console.error('Invalid webhook signature')
        throw new Error('Invalid webhook signature')
      }
    }

    const event = req.body as {
      type?: string
      event?: string
      object?: {
        id: string
        status: string
        amount: {
          value: string
          currency: string
        }
        description?: string
        created_at: string
        paid_at?: string
        metadata?: {
          payment_id?: string
          estimate_id?: string
        }
      }
    }

    // Проверяем структуру события
    if (!event.event || !event.object) {
      console.error('Invalid webhook structure:', event)
      return sendSuccess(res, { received: true, error: 'Invalid webhook structure' })
    }

    const yookassaPaymentId = event.object.id
    const status = event.object.status

    console.log(`Processing webhook: event=${event.event}, payment_id=${yookassaPaymentId}, status=${status}`)

    // Обработать событие
    if (event.event === 'payment.succeeded') {
      let paymentId = event.object.metadata?.payment_id
      let estimateId = event.object.metadata?.estimate_id

      // Если metadata отсутствует, пытаемся найти платеж по yookassa_payment_id или yookassa_invoice_id
      if (!paymentId || !estimateId) {
        console.log('Metadata not found, searching payment by YooKassa ID:', yookassaPaymentId)
        const payment = paymentService.findPaymentByYookassaId(yookassaPaymentId)
        
        if (payment) {
          paymentId = payment.id
          estimateId = payment.estimate_id
          console.log(`Found payment: ${paymentId} for estimate: ${estimateId}`)
        } else {
          console.error(`Payment not found for YooKassa ID: ${yookassaPaymentId}`)
          return sendSuccess(res, { received: true, error: 'Payment not found' })
        }
      }

      if (!paymentId || !estimateId) {
        console.error('Cannot determine payment_id or estimate_id')
        return sendSuccess(res, { received: true, error: 'Missing payment_id or estimate_id' })
      }

      // Обновить статус платежа
      try {
        paymentService.updatePaymentStatus(
          estimateId,
          paymentId,
          'succeeded',
          yookassaPaymentId,
          event.object.paid_at || new Date().toISOString()
        )
        console.log(`✅ Payment ${paymentId} succeeded for estimate ${estimateId}`)
      } catch (error) {
        console.error('Error updating payment status:', error)
        // Все равно возвращаем успех, чтобы ЮKassa не повторял запрос
      }
    } else if (event.event === 'payment.canceled') {
      let paymentId = event.object.metadata?.payment_id
      let estimateId = event.object.metadata?.estimate_id

      // Если metadata отсутствует, пытаемся найти платеж по yookassa_payment_id или yookassa_invoice_id
      if (!paymentId || !estimateId) {
        console.log('Metadata not found, searching payment by YooKassa ID:', yookassaPaymentId)
        const payment = paymentService.findPaymentByYookassaId(yookassaPaymentId)
        
        if (payment) {
          paymentId = payment.id
          estimateId = payment.estimate_id
          console.log(`Found payment: ${paymentId} for estimate: ${estimateId}`)
        } else {
          console.error(`Payment not found for YooKassa ID: ${yookassaPaymentId}`)
          return sendSuccess(res, { received: true, error: 'Payment not found' })
        }
      }

      if (!paymentId || !estimateId) {
        console.error('Cannot determine payment_id or estimate_id')
        return sendSuccess(res, { received: true, error: 'Missing payment_id or estimate_id' })
      }

      // Обновить статус платежа
      try {
        paymentService.updatePaymentStatus(
          estimateId,
          paymentId,
          'canceled',
          yookassaPaymentId
        )
        console.log(`✅ Payment ${paymentId} canceled for estimate ${estimateId}`)
      } catch (error) {
        console.error('Error updating payment status:', error)
        // Все равно возвращаем успех, чтобы ЮKassa не повторял запрос
      }
    } else {
      console.log(`Unhandled webhook event: ${event.event}`)
    }

    // ЮKassa ожидает ответ 200 OK
    sendSuccess(res, { received: true })
  })

  /**
   * Проверить, настроены ли учетные данные ЮKassa
   */
  checkConfiguration = asyncHandler(async (req: AuthRequest, res: Response) => {
    const isConfigured = yookassaService.isConfigured()
    sendSuccess(res, { configured: isConfigured })
  })
}

export const yookassaController = new YookassaController()

