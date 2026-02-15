import { v4 as uuidv4 } from 'uuid'
import {
  paymentRepository,
  paymentItemRepository,
} from '../repositories/payment.repository'
import { estimateRepository } from '../repositories/estimate.repository'
import { itemRepository } from '../repositories/item.repository'
import {
  CreatePaymentInput,
  PaymentInfo,
  ItemStatus,
} from '../types/estimate'
import { NotFoundError, ValidationError } from '../utils/errors'

/**
 * Сервис для работы с платежами
 */
export class PaymentService {
  /**
   * Создать платеж
   */
  createPayment(estimateId: string, input: CreatePaymentInput): PaymentInfo {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    if (!input.items || input.items.length === 0) {
      throw new ValidationError('Необходимо выбрать хотя бы один пункт сметы')
    }

    // Проверка суммы
    const totalAmount = input.items.reduce((sum, item) => sum + item.amount, 0)
    if (totalAmount !== input.amount) {
      throw new ValidationError('Сумма платежа не совпадает с суммой по пунктам')
    }

    if (input.amount <= 0) {
      throw new ValidationError('Сумма платежа должна быть больше нуля')
    }

    const paymentId = uuidv4()

    // Создать платеж
    paymentRepository.create(
      paymentId,
      estimateId,
      input.amount,
      input.paymentDate,
      input.notes || ''
    )

    // Создать позиции платежа
    for (const item of input.items) {
      paymentItemRepository.create(
        uuidv4(),
        paymentId,
        item.itemId,
        item.amount
      )
    }

    // Обновить баланс
    paymentRepository.updateBalance(estimateId, input.amount)

    // Получить созданный платеж с позициями
    return this.getPaymentById(estimateId, paymentId)
  }

  /**
   * Получить все платежи сметы
   */
  getPayments(estimateId: string): PaymentInfo[] {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    const payments = paymentRepository.findByEstimateId(estimateId)
    return payments.map(payment => {
      const items = paymentItemRepository.findByPaymentId(payment.id)
      return {
        id: payment.id,
        amount: payment.amount,
        paymentDate: payment.payment_date,
        notes: payment.notes,
        createdAt: payment.created_at,
        items: items.map(item => ({
          id: item.id,
          itemId: item.item_id,
          amount: item.amount,
        })),
      }
    })
  }

  /**
   * Получить платеж по ID
   */
  getPaymentById(estimateId: string, paymentId: string): PaymentInfo {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    const payment = paymentRepository.findById(paymentId)
    if (!payment || payment.estimate_id !== estimateId) {
      throw new NotFoundError('Платеж')
    }

    const items = paymentItemRepository.findByPaymentId(payment.id)
    return {
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.payment_date,
      notes: payment.notes,
      createdAt: payment.created_at,
      items: items.map(item => ({
        id: item.id,
        itemId: item.item_id,
        amount: item.amount,
      })),
    }
  }

  /**
   * Удалить платеж
   */
  deletePayment(estimateId: string, paymentId: string): void {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    const payment = paymentRepository.findById(paymentId)
    if (!payment || payment.estimate_id !== estimateId) {
      throw new NotFoundError('Платеж')
    }

    // Уменьшить баланс на сумму платежа
    paymentRepository.updateBalance(estimateId, -payment.amount)

    // Удалить платеж (позиции удалятся каскадно)
    paymentRepository.delete(paymentId)
  }

  /**
   * Получить статусы пунктов сметы (оплачено/выполнено)
   */
  getItemStatuses(estimateId: string): Record<string, ItemStatus> {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    // Получить все пункты сметы
    const items = itemRepository.findByEstimateId(estimateId)

    const statuses: Record<string, ItemStatus> = {}
    for (const item of items) {
      const paidAmount = paymentItemRepository.getItemPaidAmount(item.id, estimateId)
      const completedAmount = paymentItemRepository.getItemCompletedAmount(item.id, estimateId)
      statuses[item.id] = {
        itemId: item.id,
        paidAmount,
        completedAmount,
      }
    }

    return statuses
  }
}

export const paymentService = new PaymentService()

