import {
  paymentQueries,
  paymentItemQueries,
} from '../models/database'
import {
  PaymentRow,
  PaymentItemRow,
} from '../types/estimate'

/**
 * Репозиторий для работы с платежами
 */
export class PaymentRepository {
  /**
   * Найти все платежи для сметы
   */
  findByEstimateId(estimateId: string): PaymentRow[] {
    return paymentQueries.findByEstimateId.all(estimateId) as PaymentRow[]
  }

  /**
   * Найти платеж по ID
   */
  findById(id: string): PaymentRow | undefined {
    return paymentQueries.findById.get(id) as PaymentRow | undefined
  }

  /**
   * Создать платеж
   */
  create(
    id: string,
    estimateId: string,
    amount: number,
    paymentDate: string,
    notes: string = '',
    status: 'manual' | 'draft' | 'pending' | 'succeeded' | 'canceled' = 'manual',
    paymentMethod: 'manual' | 'yookassa' = 'manual',
    yookassaInvoiceId: string | null = null,
    yookassaPaymentId: string | null = null,
    paymentUrl: string | null = null,
    paidAt: string | null = null
  ): void {
    paymentQueries.create.run(
      id,
      estimateId,
      amount,
      paymentDate,
      notes,
      status,
      paymentMethod,
      yookassaInvoiceId,
      yookassaPaymentId,
      paymentUrl,
      paidAt
    )
  }

  /**
   * Найти платеж по ID счета ЮKassa
   */
  findByYookassaInvoiceId(yookassaInvoiceId: string): PaymentRow | undefined {
    return paymentQueries.findByYookassaInvoiceId.get(yookassaInvoiceId) as PaymentRow | undefined
  }

  /**
   * Найти платеж по ID платежа ЮKassa
   */
  findByYookassaPaymentId(yookassaPaymentId: string): PaymentRow | undefined {
    return paymentQueries.findByYookassaPaymentId.get(yookassaPaymentId) as PaymentRow | undefined
  }

  /**
   * Обновить статус платежа
   */
  updateStatus(
    id: string,
    status: 'manual' | 'draft' | 'pending' | 'succeeded' | 'canceled',
    yookassaPaymentId: string | null = null,
    paidAt: string | null = null
  ): void {
    paymentQueries.updateStatus.run(status, yookassaPaymentId, paidAt, id)
  }

  /**
   * Обновить URL оплаты
   */
  updatePaymentUrl(id: string, paymentUrl: string): void {
    paymentQueries.updatePaymentUrl.run(paymentUrl, id)
  }

  /**
   * Удалить платеж
   */
  delete(id: string): void {
    paymentQueries.delete.run(id)
  }

  /**
   * Обновить баланс сметы
   */
  updateBalance(estimateId: string, amount: number): void {
    paymentQueries.updateBalance.run(amount, estimateId)
  }
}

/**
 * Репозиторий для работы с позициями платежей
 */
export class PaymentItemRepository {
  /**
   * Найти все позиции платежа
   */
  findByPaymentId(paymentId: string): PaymentItemRow[] {
    return paymentItemQueries.findByPaymentId.all(paymentId) as PaymentItemRow[]
  }

  /**
   * Найти все платежи для пункта сметы
   */
  findByItemId(itemId: string): PaymentItemRow[] {
    return paymentItemQueries.findByItemId.all(itemId) as PaymentItemRow[]
  }

  /**
   * Найти все платежи для сметы
   */
  findByEstimateId(estimateId: string): PaymentItemRow[] {
    return paymentItemQueries.findByEstimateId.all(estimateId) as PaymentItemRow[]
  }

  /**
   * Создать позицию платежа
   */
  create(
    id: string,
    paymentId: string,
    itemId: string,
    amount: number
  ): void {
    paymentItemQueries.create.run(id, paymentId, itemId, amount)
  }

  /**
   * Удалить все позиции платежа
   */
  deleteByPaymentId(paymentId: string): void {
    paymentItemQueries.deleteByPaymentId.run(paymentId)
  }

  /**
   * Получить сумму оплаченных средств для пункта сметы
   */
  getItemPaidAmount(itemId: string, estimateId: string): number {
    const result = paymentItemQueries.getItemPaidAmount.get(itemId, estimateId) as { total_paid: number } | undefined
    return result?.total_paid || 0
  }

  /**
   * Получить сумму выполненных работ для пункта сметы
   */
  getItemCompletedAmount(itemId: string, estimateId: string): number {
    const result = paymentItemQueries.getItemCompletedAmount.get(itemId, estimateId) as { total_completed: number } | undefined
    return result?.total_completed || 0
  }
}

export const paymentRepository = new PaymentRepository()
export const paymentItemRepository = new PaymentItemRepository()

