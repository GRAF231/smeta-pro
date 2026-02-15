import { Response } from 'express'
import { AuthRequest } from '../types/common'
import { paymentService } from '../services/payment.service'
import { requireString } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response'

/**
 * Контроллер для обработки запросов платежей
 */
export class PaymentController {
  /**
   * Получить все платежи сметы
   */
  getPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const payments = paymentService.getPayments(estimateId)
    sendSuccess(res, payments)
  })

  /**
   * Получить платеж по ID
   */
  getPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const paymentId = String(req.params.paymentId)
    const payment = paymentService.getPaymentById(estimateId, paymentId)
    sendSuccess(res, payment)
  })

  /**
   * Создать платеж
   */
  createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const amount = Number(req.body.amount)
    const paymentDate = requireString(req.body.paymentDate, 'Дата платежа')
    const notes = req.body.notes || ''
    const items = req.body.items || []

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Необходимо выбрать хотя бы один пункт сметы')
    }

    const payment = paymentService.createPayment(estimateId, {
      amount,
      paymentDate,
      notes,
      items: items.map((item: any) => ({
        itemId: String(item.itemId),
        amount: Number(item.amount),
      })),
    })
    sendCreated(res, payment)
  })

  /**
   * Удалить платеж
   */
  deletePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const paymentId = String(req.params.paymentId)
    paymentService.deletePayment(estimateId, paymentId)
    sendNoContent(res)
  })

  /**
   * Получить статусы пунктов сметы (оплачено/выполнено)
   */
  getItemStatuses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const estimateId = String(req.params.id)
    const statuses = paymentService.getItemStatuses(estimateId)
    sendSuccess(res, statuses)
  })
}

export const paymentController = new PaymentController()

