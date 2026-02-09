import { useState } from 'react'
import type { EstimateSection, EstimateItem, EstimateView } from '../../types'
import { formatNumber } from '../../utils/format'
import { IconCheck, IconClose, IconTrash, IconPlus } from '../../components/ui/Icons'

interface SectionCardProps {
  section: EstimateSection
  activeViewId: string | null
  activeView: EstimateView | null
  editingItem: string | null
  editingData: { name?: string; unit?: string; quantity?: number; price?: number }
  newItemSection: string | null
  editingSectionId: string | null
  editingSectionName: string
  onEditingSectionIdChange: (id: string | null) => void
  onEditingSectionNameChange: (name: string) => void
  onRenameSectionSave: (section: EstimateSection) => void
  onSectionVisibilityChange: (sectionId: string, currentVisible: boolean) => void
  onDeleteSection: (sectionId: string, sectionName: string) => void
  onItemVisibilityChange: (sectionId: string, item: EstimateItem) => void
  onStartEditing: (item: EstimateItem) => void
  onCancelEditing: () => void
  onSaveEditing: (sectionId: string, item: EstimateItem) => void
  onEditingDataChange: (data: { name?: string; unit?: string; quantity?: number; price?: number }) => void
  onDeleteItem: (sectionId: string, itemId: string) => void
  onAddItem: (sectionId: string, name: string, unit: string, quantity: number) => void
  onNewItemSectionChange: (sectionId: string | null) => void
}

export default function SectionCard({
  section, activeViewId, activeView,
  editingItem, editingData, newItemSection,
  editingSectionId, editingSectionName,
  onEditingSectionIdChange, onEditingSectionNameChange,
  onRenameSectionSave, onSectionVisibilityChange, onDeleteSection,
  onItemVisibilityChange, onStartEditing, onCancelEditing, onSaveEditing,
  onEditingDataChange, onDeleteItem, onAddItem, onNewItemSectionChange,
}: SectionCardProps) {
  const sectionVisible = activeViewId ? (section.viewSettings[activeViewId]?.visible ?? true) : true

  return (
    <div className={`card overflow-hidden ${!sectionVisible ? 'opacity-50' : ''}`}>
      {/* Section header */}
      <div className="flex items-center justify-between -mx-3 sm:-mx-6 -mt-3 sm:-mt-6 mb-3 sm:mb-4 px-3 sm:px-6 py-3 sm:py-4 bg-slate-700/30 border-b border-slate-700/50">
        {editingSectionId === section.id ? (
          <div className="flex items-center gap-2 flex-1 mr-3">
            <input
              type="text"
              value={editingSectionName}
              onChange={(e) => onEditingSectionNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSectionSave(section)
                if (e.key === 'Escape') { onEditingSectionIdChange(null); onEditingSectionNameChange('') }
              }}
              className="input-field py-1 px-2 text-lg font-semibold flex-1"
              autoFocus
            />
            <button onClick={() => onRenameSectionSave(section)} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded">
              <IconCheck className="w-5 h-5" />
            </button>
            <button onClick={() => { onEditingSectionIdChange(null); onEditingSectionNameChange('') }} className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded">
              <IconClose className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <h2
            className="font-display font-semibold text-lg text-white cursor-pointer hover:text-primary-300 transition-colors"
            onClick={() => { onEditingSectionIdChange(section.id); onEditingSectionNameChange(section.name) }}
            title="Нажмите для переименования"
          >
            {section.name}
          </h2>
        )}
        <div className="flex items-center gap-2">
          {activeViewId && (
            <button
              onClick={() => onSectionVisibilityChange(section.id, sectionVisible)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                sectionVisible
                  ? 'bg-primary-500/30 text-primary-400 border border-primary-500/50'
                  : 'bg-slate-700/50 text-slate-500 border border-slate-600/50'
              }`}
              title={`${sectionVisible ? 'Скрыть' : 'Показать'} в "${activeView?.name}"`}
            >
              {sectionVisible ? 'Видно' : 'Скрыто'}
            </button>
          )}
          <button
            onClick={() => onDeleteSection(section.id, section.name)}
            className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Удалить раздел"
          >
            <IconTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto -mx-3 sm:-mx-6">
        <table className="w-full min-w-[700px] text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700/50">
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-10">Вкл</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2">Наименование</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-14 sm:w-20">Ед.</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-16 sm:w-24 text-right">Кол-во</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-20 sm:w-28 text-right">Цена</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-24 sm:w-32 text-right">Сумма</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-16 sm:w-24"></th>
            </tr>
          </thead>
          <tbody>
            {section.items.map(item => {
              const vs = activeViewId ? item.viewSettings[activeViewId] : null
              const itemVisible = vs?.visible ?? true
              const itemPrice = vs?.price ?? 0
              const itemTotal = vs?.total ?? 0

              return editingItem === item.id ? (
                <EditingItemRow
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  itemVisible={itemVisible}
                  itemPrice={itemPrice}
                  editingData={editingData}
                  onVisibilityChange={() => onItemVisibilityChange(section.id, item)}
                  onEditingDataChange={onEditingDataChange}
                  onSave={() => onSaveEditing(section.id, item)}
                  onCancel={onCancelEditing}
                />
              ) : (
                <DisplayItemRow
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  itemVisible={itemVisible}
                  itemPrice={itemPrice}
                  itemTotal={itemTotal}
                  onVisibilityChange={() => onItemVisibilityChange(section.id, item)}
                  onStartEditing={() => onStartEditing(item)}
                  onDelete={() => onDeleteItem(section.id, item.id)}
                />
              )
            })}

            {/* Add new item row */}
            {newItemSection === section.id ? (
              <NewItemRow
                onSave={(name, unit, qty) => onAddItem(section.id, name, unit, qty)}
                onCancel={() => onNewItemSectionChange(null)}
              />
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-2">
                  <button onClick={() => onNewItemSectionChange(section.id)} className="text-sm text-slate-500 hover:text-primary-400 flex items-center gap-1">
                    <IconPlus className="w-4 h-4" />
                    Добавить позицию
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// === Sub-components ===

function EditingItemRow({ item, itemVisible, itemPrice, editingData, onVisibilityChange, onEditingDataChange, onSave, onCancel }: {
  item: EstimateItem
  sectionId: string
  itemVisible: boolean
  itemPrice: number
  editingData: { name?: string; unit?: string; quantity?: number; price?: number }
  onVisibilityChange: () => void
  onEditingDataChange: (data: { name?: string; unit?: string; quantity?: number; price?: number }) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <tr className="bg-slate-700/40 border-b border-slate-600/50">
      <td className="px-3 py-2">
        <input type="checkbox" checked={itemVisible} onChange={onVisibilityChange} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500" />
      </td>
      <td className="px-3 py-2">
        <input type="text" value={editingData.name ?? item.name} onChange={(e) => onEditingDataChange({ ...editingData, name: e.target.value })} className="input-field py-1 px-2 text-sm w-full" autoFocus />
      </td>
      <td className="px-3 py-2">
        <input type="text" value={editingData.unit ?? item.unit} onChange={(e) => onEditingDataChange({ ...editingData, unit: e.target.value })} className="input-field py-1 px-2 text-sm w-full" />
      </td>
      <td className="px-3 py-2">
        <input type="number" step="0.1" value={editingData.quantity ?? item.quantity} onChange={(e) => onEditingDataChange({ ...editingData, quantity: parseFloat(e.target.value) || 0 })} className="input-field py-1 px-2 text-sm w-full text-right" />
      </td>
      <td className="px-3 py-2">
        <input type="number" value={editingData.price ?? itemPrice} onChange={(e) => onEditingDataChange({ ...editingData, price: parseFloat(e.target.value) || 0 })} className="input-field py-1 px-2 text-sm w-full text-right" />
      </td>
      <td className="px-3 py-2 text-right text-primary-300 font-medium">
        {formatNumber((editingData.quantity ?? item.quantity) * (editingData.price ?? itemPrice))}
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1 justify-end">
          <button onClick={onSave} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Сохранить">
            <IconCheck className="w-4 h-4" />
          </button>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded" title="Отмена">
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function DisplayItemRow({ item, itemVisible, itemPrice, itemTotal, onVisibilityChange, onStartEditing, onDelete }: {
  item: EstimateItem
  sectionId: string
  itemVisible: boolean
  itemPrice: number
  itemTotal: number
  onVisibilityChange: () => void
  onStartEditing: () => void
  onDelete: () => void
}) {
  return (
    <tr className={`border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors ${!itemVisible ? 'opacity-40' : ''}`} onClick={onStartEditing}>
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={itemVisible} onChange={onVisibilityChange} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500" />
      </td>
      <td className="px-3 py-2 text-slate-200">{item.name}</td>
      <td className="px-3 py-2 text-slate-400">{item.unit}</td>
      <td className="px-3 py-2 text-right text-slate-300">{item.quantity}</td>
      <td className="px-3 py-2 text-right text-primary-400">{formatNumber(itemPrice)}</td>
      <td className="px-3 py-2 text-right font-medium text-primary-300">{formatNumber(itemTotal)}</td>
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Удалить">
          <IconTrash className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}

function NewItemRow({ onSave, onCancel }: { onSave: (name: string, unit: string, qty: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState(0)

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave(name, unit, quantity)
  }

  return (
    <tr className="bg-slate-700/30">
      <td className="px-3 py-2"></td>
      <td className="px-3 py-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название работы" className="input-field py-1 px-2 text-sm w-full" autoFocus />
      </td>
      <td className="px-3 py-2">
        <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="шт." className="input-field py-1 px-2 text-sm w-full" />
      </td>
      <td className="px-3 py-2">
        <input type="number" step="0.1" value={quantity || ''} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} placeholder="0" className="input-field py-1 px-2 text-sm w-full text-right" />
      </td>
      <td className="px-3 py-2 text-right text-slate-500">—</td>
      <td className="px-3 py-2 text-right text-slate-500">—</td>
      <td className="px-3 py-2">
        <div className="flex gap-1 justify-end">
          <button onClick={handleSubmit} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Добавить">
            <IconCheck className="w-4 h-4" />
          </button>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded" title="Отмена">
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

