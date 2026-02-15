import { useState, useMemo } from 'react'
import Modal from './ui/Modal'
import Spinner from './ui/Spinner'
import type { ProjectWithEstimate, ItemId, ItemStatus } from '../types'
import { formatNumber } from '../utils/format'

interface PaymentModalProps {
  isOpen: boolean
  project: ProjectWithEstimate | null
  itemStatuses?: Record<string, ItemStatus>
  onClose: () => void
  onSubmit: (data: {
    amount: number
    paymentDate: string
    notes: string
    items: Array<{ itemId: ItemId; amount: number }>
  }) => Promise<void>
}

interface SelectedItem {
  itemId: ItemId
  name: string
  amount: number // Полная стоимость пункта из сметы
}

export default function PaymentModal({
  isOpen,
  project,
  itemStatuses = {},
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const [selectedItems, setSelectedItems] = useState<Map<ItemId, SelectedItem>>(new Map())
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Flatten all items from all sections with their prices
  const allItems = useMemo(() => {
    if (!project) return []
    
    // Найти смету для заказчика
    const customerView = project.views.find(v => v.isCustomerView)
    const customerViewId = customerView?.id
    
    const items: Array<{ 
      id: ItemId
      name: string
      sectionName: string
      totalPrice: number // Полная стоимость из сметы для заказчика
    }> = []
    project.sections.forEach(section => {
      section.items.forEach(item => {
        // Берем цену из сметы для заказчика, если она есть, иначе из первого доступного viewSettings
        let totalPrice = 0
        if (customerViewId && item.viewSettings[customerViewId]) {
          totalPrice = item.viewSettings[customerViewId].total || 0
        } else if (item.viewSettings && Object.keys(item.viewSettings).length > 0) {
          totalPrice = Object.values(item.viewSettings)[0]?.total || 0
        }
        
        items.push({
          id: item.id as ItemId,
          name: item.name,
          sectionName: section.name,
          totalPrice,
        })
      })
    })
    return items
  }, [project])

  const totalAmount = useMemo(() => {
    return Array.from(selectedItems.values()).reduce((sum, item) => sum + item.amount, 0)
  }, [selectedItems])

  const handleToggleItem = (itemId: ItemId, itemName: string, totalPrice: number) => {
    const status = itemStatuses[itemId]
    const isPaid = (status?.paidAmount || 0) > 0
    if (isPaid) return // Нельзя выбрать уже оплаченный пункт

    const newSelected = new Map(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.set(itemId, {
        itemId,
        name: itemName,
        amount: totalPrice, // Автоматически устанавливаем полную стоимость
      })
    }
    setSelectedItems(newSelected)
  }

  const handleToggleSection = (sectionId: string) => {
    if (!project) return
    
    const section = project.sections.find(s => s.id === sectionId)
    if (!section) return

    // Найти смету для заказчика
    const customerView = project.views.find(v => v.isCustomerView)
    const customerViewId = customerView?.id

    const sectionItems = section.items.filter(item => {
      const status = itemStatuses[item.id]
      const isPaid = (status?.paidAmount || 0) > 0
      if (isPaid) return false // Пропускаем уже оплаченные

      // Берем цену из сметы для заказчика
      let totalPrice = 0
      if (customerViewId && item.viewSettings[customerViewId]) {
        totalPrice = item.viewSettings[customerViewId].total || 0
      } else if (item.viewSettings && Object.keys(item.viewSettings).length > 0) {
        totalPrice = Object.values(item.viewSettings)[0]?.total || 0
      }
      return totalPrice > 0
    })

    // Проверяем, все ли пункты раздела уже выбраны
    const allSelected = sectionItems.every(item => selectedItems.has(item.id as ItemId))
    
    const newSelected = new Map(selectedItems)
    if (allSelected) {
      // Убираем все пункты раздела
      sectionItems.forEach(item => {
        newSelected.delete(item.id as ItemId)
      })
    } else {
      // Добавляем все пункты раздела
      sectionItems.forEach(item => {
        let totalPrice = 0
        if (customerViewId && item.viewSettings[customerViewId]) {
          totalPrice = item.viewSettings[customerViewId].total || 0
        } else if (item.viewSettings && Object.keys(item.viewSettings).length > 0) {
          totalPrice = Object.values(item.viewSettings)[0]?.total || 0
        }
        if (totalPrice > 0) {
          newSelected.set(item.id as ItemId, {
            itemId: item.id as ItemId,
            name: item.name,
            amount: totalPrice,
          })
        }
      })
    }
    setSelectedItems(newSelected)
  }

  const handleSubmit = async () => {
    if (totalAmount <= 0) {
      alert('Сумма платежа должна быть больше нуля')
      return
    }

    const items = Array.from(selectedItems.values())
    if (items.length === 0) {
      alert('Выберите хотя бы один пункт сметы')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        amount: totalAmount,
        paymentDate,
        notes,
        items: items.map(item => ({
          itemId: item.itemId,
          amount: item.amount,
        })),
      })
      // Reset form
      setSelectedItems(new Map())
      setNotes('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      onClose()
    } catch (error) {
      console.error('Error creating payment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !project) return null

  return (
    <Modal
      title="Внести платеж"
      maxWidth="max-w-4xl"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-lg font-semibold text-white">
            Итого: <span className="text-primary-400">{formatNumber(totalAmount)} ₽</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || totalAmount <= 0}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="border-white" />
                  Сохранение...
                </>
              ) : (
                'Сохранить платеж'
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Date and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Дата платежа
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="input-field"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="label">
              Примечания (необязательно)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field"
              placeholder="Например: Предоплата 50%"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Items Selection */}
        <div>
          <label className="label mb-3">
            Выберите пункты сметы для оплаты (оплачивается полная стоимость каждого пункта)
          </label>
          <div className="border border-slate-700 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            {project.sections.map(section => {
              const sectionItems = allItems.filter(item => {
                const projectItem = section.items.find(i => i.id === item.id)
                return projectItem !== undefined
              })

              if (sectionItems.length === 0) return null

              // Подсчитываем доступные для оплаты пункты
              const availableItems = sectionItems.filter(item => {
                const status = itemStatuses[item.id]
                return (status?.paidAmount || 0) === 0 && item.totalPrice > 0
              })
              
              const allSelected = availableItems.length > 0 && availableItems.every(item => selectedItems.has(item.id))
              const sectionTotal = availableItems.reduce((sum, item) => {
                if (selectedItems.has(item.id)) {
                  return sum + (selectedItems.get(item.id)?.amount || 0)
                }
                return sum + item.totalPrice
              }, 0)

              return (
                <div key={section.id} className="border-b border-slate-700 last:border-b-0">
                  <div className="bg-slate-700/50 px-4 py-2 flex items-center justify-between">
                    <h3 className="font-semibold text-white">{section.name}</h3>
                    {availableItems.length > 0 && (
                      <button
                        onClick={() => handleToggleSection(section.id)}
                        className="text-xs bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 px-3 py-1 rounded transition-colors font-medium"
                        disabled={isSubmitting}
                      >
                        {allSelected ? 'Снять все' : `Оплатить весь раздел (${formatNumber(sectionTotal)} ₽)`}
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-700">
                    {sectionItems.map(item => {
                      const isSelected = selectedItems.has(item.id)
                      const selectedItem = selectedItems.get(item.id)
                      const status = itemStatuses[item.id]
                      const isPaid = (status?.paidAmount || 0) > 0
                      const paidAmount = status?.paidAmount || 0

                      return (
                        <div
                          key={item.id}
                          className={`px-4 py-3 flex items-center gap-4 transition-colors ${
                            isPaid 
                              ? 'bg-slate-800/30 opacity-60 cursor-not-allowed' 
                              : isSelected 
                                ? 'bg-primary-500/10 hover:bg-primary-500/20' 
                                : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleItem(item.id, item.name, item.totalPrice)}
                            className="w-5 h-5 rounded border-slate-600 text-primary-500 focus:ring-primary-500"
                            disabled={isSubmitting || item.totalPrice <= 0 || isPaid}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-slate-300 truncate">
                                {item.name}
                              </div>
                              {isPaid && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">
                                  Оплачено
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Стоимость: {formatNumber(item.totalPrice)} ₽
                              {isPaid && (
                                <span className="ml-2 text-green-400">
                                  (Оплачено: {formatNumber(paidAmount)} ₽)
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && !isPaid && (
                            <div className="text-sm font-medium text-primary-400">
                              {formatNumber(selectedItem?.amount || 0)} ₽
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

