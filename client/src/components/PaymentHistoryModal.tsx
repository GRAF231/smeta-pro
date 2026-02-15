import { useState, useEffect } from 'react'
import type { Payment, ProjectWithEstimate, ProjectId } from '../types'
import { formatNumber, formatDateRu } from '../utils/format'
import { projectsApi } from '../services/api'
import { IconTrash } from './ui/Icons'
import Modal from './ui/Modal'
import Spinner from './ui/Spinner'
import { copyToClipboard } from '../utils/clipboard'
import { useToast } from './ui/ToastContainer'

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
  const [checkingStatusId, setCheckingStatusId] = useState<string | null>(null)
  const { showInfo, showError } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadPayments()
      setExpandedPaymentId(null)
      setDeleteConfirmId(null)
      setCheckingStatusId(null)
    } else {
      // Reset states when modal closes
      setExpandedPaymentId(null)
      setDeleteConfirmId(null)
      setCheckingStatusId(null)
    }
  }, [isOpen, projectId])

  // Автоматически проверяем статус платежей со статусом pending при открытии модального окна
  useEffect(() => {
    if (!isOpen || payments.length === 0) {
      return
    }

    const pendingPayments = payments.filter(
      p => p.paymentMethod === 'yookassa' && p.status === 'pending'
    )
    
    // Проверяем статус каждого pending платежа (только один раз при открытии)
    if (pendingPayments.length === 0) {
      return
    }

    // Небольшая задержка перед проверкой, чтобы дать время загрузиться данным
    const timeoutId = setTimeout(() => {
      pendingPayments.forEach(payment => {
        projectsApi.checkPaymentStatus(projectId, payment.id as any)
          .then(response => {
            // Обновляем платеж в списке только если статус изменился
            if (response.data.status !== payment.status) {
              setPayments(prev => prev.map(p => 
                p.id === payment.id ? response.data : p
              ))
              if (response.data.status === 'succeeded' && onPaymentDeleted) {
                onPaymentDeleted()
              }
            }
          })
          .catch(error => {
            console.error('Error checking payment status:', error)
          })
      })
    }, 1000) // Проверяем через 1 секунду после открытия

    return () => clearTimeout(timeoutId)
  }, [isOpen, projectId]) // Убрали payments.length из зависимостей, чтобы избежать бесконечного цикла

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
                            {/* Payment status badge */}
                            {payment.paymentMethod === 'yookassa' && (
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                payment.status === 'succeeded' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : payment.status === 'canceled'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              }`}>
                                {payment.status === 'succeeded' && 'Оплачено'}
                                {payment.status === 'pending' && 'Ожидает оплаты'}
                                {payment.status === 'canceled' && 'Отменено'}
                                {payment.status === 'draft' && 'Черновик'}
                              </span>
                            )}
                            {payment.paymentMethod === 'manual' && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                                Ручной платеж
                              </span>
                            )}
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
                        {/* Quick copy link button for YooKassa invoices */}
                        {payment.paymentMethod === 'yookassa' && payment.paymentUrl && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              const success = await copyToClipboard(payment.paymentUrl!)
                              if (success) {
                                showInfo('Ссылка скопирована в буфер обмена', 2000)
                              } else {
                                showError('Не удалось скопировать ссылку', 2000)
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="Скопировать ссылку на оплату"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        )}
                        {/* Check status button for pending YooKassa payments */}
                        {payment.paymentMethod === 'yookassa' && payment.status === 'pending' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              setCheckingStatusId(payment.id)
                              try {
                                const response = await projectsApi.checkPaymentStatus(projectId, payment.id as any)
                                setPayments(prev => prev.map(p => 
                                  p.id === payment.id ? response.data : p
                                ))
                                if (response.data.status === 'succeeded') {
                                  showInfo('Платеж успешно оплачен!', 3000)
                                  if (onPaymentDeleted) {
                                    onPaymentDeleted()
                                  }
                                } else if (response.data.status === 'canceled') {
                                  showInfo('Платеж отменен', 3000)
                                } else {
                                  showInfo('Статус платежа обновлен', 2000)
                                }
                              } catch (error) {
                                console.error('Error checking payment status:', error)
                                showError('Не удалось проверить статус платежа', 3000)
                              } finally {
                                setCheckingStatusId(null)
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Проверить статус платежа"
                            disabled={checkingStatusId === payment.id}
                          >
                            {checkingStatusId === payment.id ? (
                              <Spinner size="sm" className="border-slate-400" />
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            )}
                          </button>
                        )}
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
                          {/* Payment URL for YooKassa invoices */}
                          {payment.paymentMethod === 'yookassa' && payment.paymentUrl && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-slate-400">
                                  {payment.status === 'pending' ? 'Ссылка для оплаты:' : 'Ссылка на оплату:'}
                                </div>
                                {payment.status === 'pending' && (
                                  <a
                                    href={payment.paymentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-400 hover:text-primary-300 underline"
                                  >
                                    Открыть для оплаты →
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-slate-500 mb-1">Ссылка:</div>
                                  <div className="text-sm text-slate-300 font-mono truncate">
                                    {payment.paymentUrl}
                                  </div>
                                </div>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    const success = await copyToClipboard(payment.paymentUrl!)
                                    if (success) {
                                      showInfo('Ссылка скопирована в буфер обмена', 3000)
                                    } else {
                                      showError('Не удалось скопировать ссылку', 3000)
                                    }
                                  }}
                                  className="flex-shrink-0 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-xs font-medium border border-primary-500/30"
                                  title="Скопировать ссылку"
                                >
                                  <svg
                                    className="w-4 h-4 inline-block mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Копировать
                                </button>
                              </div>
                            </div>
                          )}
                          {/* Paid date for succeeded payments */}
                          {payment.paidAt && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="text-xs text-slate-400 mb-1">Дата оплаты:</div>
                              <div className="text-sm text-slate-300">{formatDateRu(payment.paidAt)}</div>
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

