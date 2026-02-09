/**
 * MaterialsPage actions component
 * 
 * Displays action buttons for materials operations.
 */

import { IconDocument, IconRefresh, IconPlus } from '../../../components/ui/Icons'

interface MaterialsActionsProps {
  materialsCount: number
  isRefreshing: boolean
  onPdfGeneratorClick: () => void
  onRefreshAll: () => void
  onAddMaterialsClick: () => void
}

/**
 * MaterialsPage actions component
 * 
 * @param props - Actions props
 * @returns Actions JSX
 */
export default function MaterialsActions({
  materialsCount,
  isRefreshing,
  onPdfGeneratorClick,
  onRefreshAll,
  onAddMaterialsClick,
}: MaterialsActionsProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={onPdfGeneratorClick}
        disabled={materialsCount === 0}
        className="btn-secondary flex items-center gap-2"
      >
        <IconDocument className="w-5 h-5" />
        Создать КП (PDF)
      </button>
      <button
        onClick={onRefreshAll}
        disabled={isRefreshing || materialsCount === 0}
        className="btn-secondary flex items-center gap-2"
      >
        <IconRefresh className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Обновление...' : 'Актуализировать цены'}
      </button>
      <button onClick={onAddMaterialsClick} className="btn-primary flex items-center gap-2">
        <IconPlus className="w-5 h-5" />
        Добавить материалы
      </button>
    </div>
  )
}


