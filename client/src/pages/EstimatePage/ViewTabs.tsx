import { useState } from 'react'
import type { EstimateView, ViewId } from '../../types'
import { formatNumber } from '../../utils/format'
import { IconPlus, IconDuplicate, IconClose, IconCheck } from '../../components/ui/Icons'
import { asViewId } from '../../types'

interface ViewTabsProps {
  views: EstimateView[]
  activeViewId: ViewId | null
  totals: Record<string, number>
  onSelectView: (viewId: ViewId) => void
  onAddView: (name: string) => Promise<void>
  onDuplicateView: (viewId: ViewId) => void
  onDeleteView: (viewId: ViewId) => void
}

export default function ViewTabs({
  views, activeViewId, totals,
  onSelectView, onAddView, onDuplicateView, onDeleteView,
}: ViewTabsProps) {
  const [showAddView, setShowAddView] = useState(false)
  const [newViewName, setNewViewName] = useState('')

  const handleAddView = async () => {
    if (!newViewName.trim()) return
    await onAddView(newViewName.trim())
    setNewViewName('')
    setShowAddView(false)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {views.map(view => (
          <div key={view.id} className="flex items-center group">
            <button
              onClick={() => onSelectView(asViewId(view.id))}
              className={`px-4 py-2.5 rounded-t-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeViewId === view.id
                  ? 'bg-slate-700/60 text-white border border-b-0 border-slate-600/50'
                  : 'bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-700/30 border border-transparent'
              }`}
            >
              {view.name}
              <span className="ml-2 text-xs opacity-60">
                {formatNumber(totals[view.id] || 0)} ₽
              </span>
            </button>
            {activeViewId === view.id && (
              <>
                <button
                  onClick={() => onDuplicateView(asViewId(view.id))}
                  className="ml-0.5 p-1 text-slate-500 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Дублировать"
                >
                  <IconDuplicate className="w-3.5 h-3.5" />
                </button>
                {views.length > 1 && (
                  <button
                    onClick={() => onDeleteView(asViewId(view.id))}
                    className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить"
                  >
                    <IconClose className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        {showAddView ? (
          <div className="flex items-center gap-1 ml-1">
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddView()
                if (e.key === 'Escape') { setShowAddView(false); setNewViewName('') }
              }}
              placeholder="Название..."
              className="input-field py-1.5 px-3 text-sm w-40"
              autoFocus
            />
            <button onClick={handleAddView} disabled={!newViewName.trim()} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded">
              <IconCheck className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowAddView(false); setNewViewName('') }} className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded">
              <IconClose className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddView(true)}
            className="px-3 py-2.5 rounded-t-xl text-sm text-slate-500 hover:text-primary-400 hover:bg-slate-700/20 transition-all flex items-center gap-1"
            title="Добавить представление"
          >
            <IconPlus className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="border-b border-slate-700/50 -mt-px"></div>
    </div>
  )
}

