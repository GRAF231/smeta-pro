import { v4 as uuidv4 } from 'uuid'
import {
  paymentRepository,
  paymentItemRepository,
} from '../repositories/payment.repository'
import { estimateRepository } from '../repositories/estimate.repository'
import { itemRepository } from '../repositories/item.repository'
import {
  CreatePaymentInput,
  CreateYookassaInvoiceInput,
  PaymentInfo,
  ItemStatus,
  PaymentRow,
} from '../types/estimate'
import { NotFoundError, ValidationError } from '../utils/errors'
import { yookassaService } from './yookassa.service'

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

    // Определить метод платежа
    const paymentMethod = input.paymentMethod || 'manual'
    const status = paymentMethod === 'manual' ? 'manual' : 'draft'

    // Создать платеж
    paymentRepository.create(
      paymentId,
      estimateId,
      input.amount,
      input.paymentDate,
      input.notes || '',
      status,
      paymentMethod
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

    // Обновить баланс только для ручных платежей
    if (paymentMethod === 'manual') {
    paymentRepository.updateBalance(estimateId, input.amount)
    }

    // Получить созданный платеж с позициями
    return this.getPaymentById(estimateId, paymentId)
  }

  /**
   * Создать счет через ЮKassa
   */
  async createYookassaInvoice(
    estimateId: string,
    input: CreateYookassaInvoiceInput
  ): Promise<PaymentInfo> {
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

    // Максимальная сумма платежа через ЮKassa - 350,000 рублей
    const MAX_YOOKASSA_AMOUNT = 350000
    if (input.amount > MAX_YOOKASSA_AMOUNT) {
      throw new ValidationError(
        `Максимальная сумма платежа через ЮKassa составляет ${MAX_YOOKASSA_AMOUNT.toLocaleString('ru-RU')} ₽. ` +
        `Текущая сумма: ${input.amount.toLocaleString('ru-RU')} ₽. ` +
        `Пожалуйста, разделите платеж на несколько частей или используйте ручное внесение платежа.`
      )
    }

    const paymentId = uuidv4()

    // Обновить данные заказчика в смете, если они предоставлены
    if (input.customerEmail || input.customerPhone || input.customerName) {
      estimateRepository.updateCustomerData(
        estimateId,
        input.customerEmail || null,
        input.customerPhone || null,
        input.customerName || null
      )
    }

    // Получить данные заказчика из сметы
    const customerEmail = input.customerEmail || estimate.customer_email || undefined
    const customerPhone = input.customerPhone || estimate.customer_phone || undefined
    const customerName = input.customerName || estimate.customer_name || undefined

    // Создать запрос к ЮKassa
    const yookassaRequest = {
      amount: {
        value: input.amount.toFixed(2),
        currency: 'RUB',
      },
      description: (input.notes || `Оплата по проекту "${estimate.title}"`).substring(0, 128), // Максимум 128 символов
      capture: true, // Обязательный параметр - получить деньги сразу после оплаты
      receipt: (customerEmail || customerPhone || customerName) ? {
        customer: {
          ...(customerEmail && { email: customerEmail }),
          ...(customerPhone && { phone: customerPhone }),
          ...(customerName && { full_name: customerName }),
        },
        items: input.items.map((item, index) => {
          const estimateItem = itemRepository.findById(item.itemId)
          return {
            description: (estimateItem?.name || `Позиция ${index + 1}`).substring(0, 128),
            quantity: '1',
            amount: {
              value: item.amount.toFixed(2),
              currency: 'RUB',
            },
            vat_code: 1, // НДС не облагается
          }
        }),
      } : undefined,
      confirmation: {
        type: 'redirect' as const,
        return_url: yookassaService['returnUrl'],
      },
      metadata: {
        payment_id: paymentId,
        estimate_id: estimateId,
      },
    }

    // Создать счет в ЮKassa
    const yookassaResponse = await yookassaService.createInvoice(yookassaRequest)

    // Создать платеж в БД со статусом 'draft'
    paymentRepository.create(
      paymentId,
      estimateId,
      input.amount,
      input.paymentDate,
      input.notes || '',
      'draft',
      'yookassa',
      yookassaResponse.id,
      null,
      yookassaResponse.confirmation.confirmation_url,
      null
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

    // Обновить статус на 'pending' после успешного создания
    paymentRepository.updateStatus(paymentId, 'pending')

    // Получить созданный платеж с позициями
    return this.getPaymentById(estimateId, paymentId)
  }

  /**
   * Найти платеж по ID от ЮKassa (invoice_id или payment_id)
   */
  findPaymentByYookassaId(yookassaId: string): PaymentRow | null {
    // Сначала ищем по yookassa_payment_id
    let payment = paymentRepository.findByYookassaPaymentId(yookassaId)
    if (payment) {
      return payment
    }
    
    // Если не нашли, ищем по yookassa_invoice_id
    payment = paymentRepository.findByYookassaInvoiceId(yookassaId)
    if (payment) {
      return payment
    }
    
    return null
  }

  /**
   * Обновить статус платежа
   */
  updatePaymentStatus(
    estimateId: string,
    paymentId: string,
    status: 'pending' | 'succeeded' | 'canceled',
    yookassaPaymentId?: string,
    paidAt?: string
  ): PaymentInfo {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    const payment = paymentRepository.findById(paymentId)
    if (!payment || payment.estimate_id !== estimateId) {
      throw new NotFoundError('Платеж')
    }

    // Обновить статус
    paymentRepository.updateStatus(
      paymentId,
      status,
      yookassaPaymentId || null,
      paidAt || null
    )

    // Если платеж успешно оплачен, обновить баланс
    if (status === 'succeeded' && payment.status !== 'succeeded') {
      paymentRepository.updateBalance(estimateId, payment.amount)
    }

    // Если платеж был успешным и теперь отменен, уменьшить баланс
    if (status === 'canceled' && payment.status === 'succeeded') {
      paymentRepository.updateBalance(estimateId, -payment.amount)
    }

    return this.getPaymentById(estimateId, paymentId)
  }

  /**
   * Проверить и обновить статус платежа через ЮKassa API
   */
  async checkPaymentStatus(estimateId: string, paymentId: string): Promise<PaymentInfo> {
    const estimate = estimateRepository.findById(estimateId)
    if (!estimate) {
      throw new NotFoundError('Смета')
    }

    const payment = paymentRepository.findById(paymentId)
    if (!payment || payment.estimate_id !== estimateId) {
      throw new NotFoundError('Платеж')
    }

    // Проверяем только платежи через ЮKassa со статусом pending
    if (payment.payment_method !== 'yookassa' || payment.status !== 'pending') {
      return this.getPaymentById(estimateId, paymentId)
    }

    // Если нет invoice_id, не можем проверить статус
    if (!payment.yookassa_invoice_id) {
      return this.getPaymentById(estimateId, paymentId)
    }

    try {
      // Получить статус платежа из ЮKassa
      console.log(`Checking payment status for invoice ID: ${payment.yookassa_invoice_id}`)
      const yookassaStatus = await yookassaService.getPaymentStatus(payment.yookassa_invoice_id)
      console.log(`YooKassa payment status: ${yookassaStatus.status} for payment ${paymentId}`)
      
      // Обновить статус в зависимости от ответа ЮKassa
      if (yookassaStatus.status === 'succeeded') {
        console.log(`Updating payment ${paymentId} to succeeded`)
        this.updatePaymentStatus(
          estimateId,
          paymentId,
          'succeeded',
          yookassaStatus.id,
          yookassaStatus.paid_at || new Date().toISOString()
        )
      } else if (yookassaStatus.status === 'canceled') {
        console.log(`Updating payment ${paymentId} to canceled`)
        this.updatePaymentStatus(
          estimateId,
          paymentId,
          'canceled',
          yookassaStatus.id
        )
      } else {
        console.log(`Payment ${paymentId} status is still ${yookassaStatus.status}, no update needed`)
      }
      // Если статус все еще pending, ничего не делаем

      return this.getPaymentById(estimateId, paymentId)
    } catch (error) {
      console.error('Error checking payment status from YooKassa:', error)
      // Возвращаем текущий статус, даже если не удалось проверить
      return this.getPaymentById(estimateId, paymentId)
    }
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
        status: payment.status,
        paymentMethod: payment.payment_method,
        yookassaInvoiceId: payment.yookassa_invoice_id,
        yookassaPaymentId: payment.yookassa_payment_id,
        paymentUrl: payment.payment_url,
        paidAt: payment.paid_at,
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
      status: payment.status,
      paymentMethod: payment.payment_method,
      yookassaInvoiceId: payment.yookassa_invoice_id,
      yookassaPaymentId: payment.yookassa_payment_id,
      paymentUrl: payment.payment_url,
      paidAt: payment.paid_at,
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

    // Уменьшить баланс на сумму платежа только для успешно оплаченных платежей
    if (payment.status === 'manual' || payment.status === 'succeeded') {
    paymentRepository.updateBalance(estimateId, -payment.amount)
    }

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

