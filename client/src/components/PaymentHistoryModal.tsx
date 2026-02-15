import { useState, useEffect } from 'react'
import type { Payment, ProjectWithEstimate, ProjectId } from '../types'
import { formatNumber, formatDateShortRu, formatDateRu } from '../utils/format'
import { projectsApi } from '../services/api'
import { IconTrash } from './ui/Icons'
import Modal from './ui/Modal'
import Spinner from './ui/Spinner'

interface PaymentHistoryModalProps {
  isOpen: boolean
  projectId: ProjectId
  project: ProjectWithEstimate
  onClose: () => void
  onPaymentDeleted?: () => void
}

export default function PaymentHistoryModal({
  isOpen,
  projectId,
  project,
  onClose,
  onPaymentDeleted,
}: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPayments()
      setExpandedPaymentId(null)
      setDeleteConfirmId(null)
    } else {
      // Reset states when modal closes
      setExpandedPaymentId(null)
      setDeleteConfirmId(null)
    }
  }, [isOpen, projectId])

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      const res = await projectsApi.getPayments(projectId)
      setPayments(res.data || [])
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (paymentId: string) => {
    try {
      await projectsApi.deletePayment(projectId, paymentId as any)
      setPayments(payments.filter(p => p.id !== paymentId))
      setDeleteConfirmId(null)
      if (onPaymentDeleted) {
        onPaymentDeleted()
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Ошибка при удалении платежа')
    }
  }

  const getItemName = (itemId: string): string => {
    for (const section of project.sections) {
      const item = section.items.find(i => i.id === itemId)
      if (item) return item.name
    }
    return `Пункт ${itemId.slice(0, 8)}...`
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  if (!isOpen) {
    return null
  }

  return (
    <>
      <Modal
        title="История платежей"
        maxWidth="max-w-4xl"
        onClose={onClose}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-2">Платежей пока нет</p>
            <p className="text-slate-500 text-sm">Добавьте первый платеж, чтобы начать отслеживать историю</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Всего платежей:</span>
                <span className="text-white font-semibold">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-300 text-sm">Общая сумма:</span>
                <span className="text-primary-400 font-bold text-lg">{formatNumber(totalAmount)} ₽</span>
              </div>
            </div>

            {/* Payments list */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {payments.map((payment, index) => {
                const isExpanded = expandedPaymentId === payment.id
                
                return (
                  <div
                    key={payment.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors"
                  >
                    {/* Payment header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                      onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="font-semibold text-white text-lg">
                              {formatNumber(payment.amount)} ₽
                            </span>
                            <span className="text-sm text-slate-400">
                              {formatDateRu(payment.paymentDate)}
                            </span>
                          </div>
                          {payment.notes && (
                            <p className="text-sm text-slate-400 truncate">{payment.notes}</p>
                          )}
                          <div className="text-xs text-slate-500 mt-1">
                            {payment.items.length} {payment.items.length === 1 ? 'пункт' : 'пунктов'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(payment.id)
                          }}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Удалить платеж"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                        <svg
                          className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-slate-700 bg-slate-900/50">
                        <div className="p-4">
                          <div className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                            <span>Оплачено за:</span>
                            <span className="text-primary-400">{formatNumber(payment.amount)} ₽</span>
                          </div>
                          <div className="space-y-2">
                            {payment.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded border border-slate-700/50 hover:border-slate-600 transition-colors"
                              >
                                <span className="text-slate-200 flex-1 min-w-0 pr-4 text-sm">
                                  {getItemName(item.itemId)}
                                </span>
                                <span className="text-primary-400 font-semibold shrink-0 text-sm">
                                  {formatNumber(item.amount)} ₽
                                </span>
                              </div>
                            ))}
                          </div>
                          {payment.notes && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="text-xs text-slate-400 mb-1">Примечание:</div>
                              <div className="text-sm text-slate-300">{payment.notes}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <Modal
          title="Удалить платеж?"
          maxWidth="max-w-md"
          onClose={() => setDeleteConfirmId(null)}
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn-primary bg-red-500 hover:bg-red-600"
              >
                Удалить
              </button>
            </div>
          }
        >
          <p className="text-slate-300">
            Вы уверены, что хотите удалить этот платеж? Баланс проекта будет пересчитан.
          </p>
        </Modal>
      )}
    </>
  )
}

