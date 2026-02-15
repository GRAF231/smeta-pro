import { useState, useEffect } from 'react'
import PaymentModal from './PaymentModal'
import PaymentHistoryModal from './PaymentHistoryModal'
import type { ProjectWithEstimate, ProjectId, ItemStatus } from '../types'
import { formatNumber } from '../utils/format'
import { projectsApi } from '../services/api'

interface BalanceDisplayProps {
  project: ProjectWithEstimate
  projectId: ProjectId
  onBalanceUpdate?: () => void
}

export default function BalanceDisplay({
  project,
  projectId,
  onBalanceUpdate,
}: BalanceDisplayProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({})

  useEffect(() => {
    if (isPaymentModalOpen) {
      loadItemStatuses()
    }
  }, [isPaymentModalOpen, projectId])

  const loadItemStatuses = async () => {
    try {
      const res = await projectsApi.getItemStatuses(projectId)
      setItemStatuses(res.data || {})
    } catch (error) {
      console.error('Error loading item statuses:', error)
    }
  }

  const handleSubmitPayment = async (data: {
    amount: number
    paymentDate: string
    notes: string
    items: Array<{ itemId: string; amount: number }>
  }) => {
    setIsSubmitting(true)
    try {
      await projectsApi.createPayment(projectId, data)
      setIsPaymentModalOpen(false)
      if (onBalanceUpdate) {
        onBalanceUpdate()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentDeleted = () => {
    if (onBalanceUpdate) {
      onBalanceUpdate()
    }
  }

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Баланс:</span>
            <span className="text-lg font-semibold text-white">
              {formatNumber(project.balance || 0)} ₽
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors px-2 py-1"
              title="История платежей"
            >
              История
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded transition-colors font-medium"
            >
              Внести платеж
            </button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        project={project}
        itemStatuses={itemStatuses}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleSubmitPayment}
      />

      <PaymentHistoryModal
        isOpen={isHistoryModalOpen}
        projectId={projectId}
        project={project}
        onClose={() => setIsHistoryModalOpen(false)}
        onPaymentDeleted={handlePaymentDeleted}
      />
    </>
  )
}

