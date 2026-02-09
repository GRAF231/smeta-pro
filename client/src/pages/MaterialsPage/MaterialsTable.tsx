import type { Material, MaterialId } from '../../types'
import { formatMoney } from '../../utils/format'
import { IconCheck, IconClose, IconRefresh, IconTrash } from '../../components/ui/Icons'
import { asMaterialId } from '../../types'

interface MaterialsTableProps {
  materials: Material[]
  editingId: MaterialId | null
  editingData: Partial<Material>
  refreshingItemId: MaterialId | null
  grandTotal: number
  onStartEditing: (material: Material) => void
  onSaveEditing: (material: Material) => void
  onCancelEditing: () => void
  onEditingDataChange: (data: Partial<Material>) => void
  onRefreshOne: (materialId: MaterialId) => void
  onDelete: (materialId: MaterialId) => void
}

export default function MaterialsTable({
  materials,
  editingId,
  editingData,
  refreshingItemId,
  grandTotal,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onEditingDataChange,
  onRefreshOne,
  onDelete,
}: MaterialsTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto -mx-3 sm:-mx-6">
        <table className="w-full min-w-[1100px] text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700/50">
              <th className="px-2 sm:px-3 py-2 w-8">#</th>
              <th className="px-2 sm:px-3 py-2">Наименование</th>
              <th className="px-2 sm:px-3 py-2 w-24">Артикул</th>
              <th className="px-2 sm:px-3 py-2 w-24">Бренд</th>
              <th className="px-2 sm:px-3 py-2 w-14">Ед.</th>
              <th className="px-2 sm:px-3 py-2 w-24 text-right">Цена</th>
              <th className="px-2 sm:px-3 py-2 w-16 text-right">Кол-во</th>
              <th className="px-2 sm:px-3 py-2 w-28 text-right">Сумма</th>
              <th className="px-2 sm:px-3 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, index) =>
              editingId === asMaterialId(material.id) ? (
                // Editing row
                <tr key={material.id} className="bg-slate-700/40 border-b border-slate-600/50">
                  <td className="px-2 sm:px-3 py-2 text-slate-500">{index + 1}</td>
                  <td className="px-2 sm:px-3 py-2">
                    <input
                      type="text"
                      value={editingData.name ?? material.name}
                      onChange={e => onEditingDataChange({ ...editingData, name: e.target.value })}
                      className="input-field py-1 px-2 text-sm w-full"
                      autoFocus
                    />
                  </td>
                  <td className="px-2 sm:px-3 py-2">
                    <input
                      type="text"
                      value={editingData.article ?? material.article}
                      onChange={e => onEditingDataChange({ ...editingData, article: e.target.value })}
                      className="input-field py-1 px-2 text-sm w-full"
                    />
                  </td>
                  <td className="px-2 sm:px-3 py-2">
                    <input
                      type="text"
                      value={editingData.brand ?? material.brand}
                      onChange={e => onEditingDataChange({ ...editingData, brand: e.target.value })}
                      className="input-field py-1 px-2 text-sm w-full"
                    />
                  </td>
                  <td className="px-2 sm:px-3 py-2">
                    <input
                      type="text"
                      value={editingData.unit ?? material.unit}
                      onChange={e => onEditingDataChange({ ...editingData, unit: e.target.value })}
                      className="input-field py-1 px-2 text-sm w-full"
                    />
                  </td>
                  <td className="px-2 sm:px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editingData.price ?? material.price}
                      onChange={e => onEditingDataChange({ ...editingData, price: parseFloat(e.target.value) || 0 })}
                      className="input-field py-1 px-2 text-sm w-full text-right"
                    />
                  </td>
                  <td className="px-2 sm:px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      value={editingData.quantity ?? material.quantity}
                      onChange={e => onEditingDataChange({ ...editingData, quantity: parseFloat(e.target.value) || 0 })}
                      className="input-field py-1 px-2 text-sm w-full text-right"
                    />
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right text-primary-300 font-medium">
                    {formatMoney((editingData.price ?? material.price) * (editingData.quantity ?? material.quantity))}
                  </td>
                  <td className="px-2 sm:px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => onSaveEditing(material)}
                        className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                        title="Сохранить"
                      >
                        <IconCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onCancelEditing}
                        className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded"
                        title="Отмена"
                      >
                        <IconClose className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // Display row
                <tr
                  key={material.id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors group"
                  onClick={() => onStartEditing(material)}
                >
                  <td className="px-2 sm:px-3 py-2 text-slate-500">{index + 1}</td>
                  <td className="px-2 sm:px-3 py-2">
                    <div className="text-slate-200">{material.name}</div>
                    {material.description && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{material.description}</div>
                    )}
                    {material.url && (
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-500 hover:text-primary-400 mt-0.5 block truncate max-w-[300px]"
                        onClick={e => e.stopPropagation()}
                      >
                        {material.url}
                      </a>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-slate-400 text-xs">{material.article}</td>
                  <td className="px-2 sm:px-3 py-2 text-slate-400 text-xs">{material.brand}</td>
                  <td className="px-2 sm:px-3 py-2 text-slate-400">{material.unit}</td>
                  <td className="px-2 sm:px-3 py-2 text-right text-primary-400">{formatMoney(material.price)}</td>
                  <td className="px-2 sm:px-3 py-2 text-right text-slate-300">{material.quantity}</td>
                  <td className="px-2 sm:px-3 py-2 text-right font-medium text-primary-300">{formatMoney(material.total)}</td>
                  <td className="px-2 sm:px-3 py-2" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {material.url && (
                        <button
                          onClick={() => onRefreshOne(asMaterialId(material.id))}
                          disabled={refreshingItemId === asMaterialId(material.id)}
                          className="p-1.5 text-slate-400 hover:text-primary-400 transition-colors"
                          title="Обновить из ссылки"
                        >
                          <IconRefresh className={`w-4 h-4 ${refreshingItemId === asMaterialId(material.id) ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(asMaterialId(material.id))}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Удалить"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600/50">
              <td colSpan={7} className="px-2 sm:px-3 py-3 text-right font-semibold text-slate-300">
                Итого:
              </td>
              <td className="px-2 sm:px-3 py-3 text-right font-display font-bold text-primary-400 text-base">
                {formatMoney(grandTotal)} ₽
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

