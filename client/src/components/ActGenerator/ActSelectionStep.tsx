import type { EstimateSection, UsedItemsMap, ViewId } from '../../types'
import { formatMoney } from '../../utils/format'

interface ActSelectionStepProps {
  sections: EstimateSection[]
  selectionMode: 'sections' | 'items'
  selectedSections: Set<string>
  selectedItems: Set<string>
  usedItems: UsedItemsMap
  selectedViewId: ViewId | null
  actLinesCount: number
  grandTotal: number
  onSelectionModeChange: (mode: 'sections' | 'items') => void
  onToggleSection: (sectionId: string) => void
  onToggleItem: (sectionId: string, itemId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  getItemTotal: (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }) => number
}

export default function ActSelectionStep({
  sections,
  selectionMode,
  selectedSections,
  selectedItems,
  usedItems,
  actLinesCount,
  grandTotal,
  onSelectionModeChange,
  onToggleSection,
  onToggleItem,
  onSelectAll,
  onDeselectAll,
  getItemTotal,
}: ActSelectionStepProps) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Выберите позиции для акта</h3>
        <div className="flex items-center gap-2">
          <button onClick={onSelectAll} className="text-xs text-primary-400 hover:text-primary-300">Выбрать всё</button>
          <span className="text-slate-600">|</span>
          <button onClick={onDeselectAll} className="text-xs text-slate-400 hover:text-slate-300">Снять всё</button>
        </div>
      </div>
      <div className="flex gap-2">
        {(['sections', 'items'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onSelectionModeChange(mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectionMode === mode
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
            }`}
          >
            {mode === 'sections' ? 'По разделам' : 'По позициям'}
          </button>
        ))}
      </div>

      {/* Sections / Items checkboxes */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {sections.map(section => {
          const usedInSectionCount = section.items.filter(i => usedItems[i.id]?.length > 0).length
          return (
            <div key={section.id} className="bg-slate-700/20 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => onToggleSection(section.id)}>
                <input type="checkbox" checked={selectedSections.has(section.id)} onChange={() => onToggleSection(section.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500" />
                <span className="font-medium text-white text-sm flex-1">{section.name}</span>
                <div className="flex items-center gap-2">
                  {usedInSectionCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30" title={`${usedInSectionCount} из ${section.items.length} поз. уже были в актах`}>
                      {usedInSectionCount} в актах
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{section.items.filter(i => selectedItems.has(i.id)).length} / {section.items.length} поз.</span>
                </div>
              </div>
              {selectionMode === 'items' && (
                <div className="px-4 py-2 space-y-1">
                  {section.items.map(item => {
                    const itemUsage = usedItems[item.id]
                    const isUsed = itemUsage && itemUsage.length > 0
                    return (
                      <div key={item.id} className={`flex items-center gap-3 px-3 py-1.5 rounded hover:bg-slate-700/30 cursor-pointer transition-colors ${isUsed ? 'bg-amber-500/5' : ''}`} onClick={() => onToggleItem(section.id, item.id)}>
                        <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => onToggleItem(section.id, item.id)} onClick={e => e.stopPropagation()} className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500" />
                        <span className={`text-sm flex-1 ${isUsed ? 'text-amber-200' : 'text-slate-300'}`}>{item.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isUsed && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap" title={itemUsage.map(u => `Акт №${u.actNumber} от ${u.actDate}`).join('\n')}>
                              Акт {itemUsage.map(u => `№${u.actNumber}`).join(', ')}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{formatMoney(getItemTotal(item))} ₽</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {actLinesCount > 0 && (
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">
              Итого в акте: <strong className="text-white">{actLinesCount}</strong> {selectionMode === 'sections' ? 'разделов' : 'позиций'}
            </span>
            <span className="font-display font-bold text-primary-400 text-lg">{formatMoney(grandTotal)} ₽</span>
          </div>
        </div>
      )}
    </div>
  )
}

