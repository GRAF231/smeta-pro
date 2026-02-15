import { useState } from 'react'
import type { EstimateView, ViewId, ProjectWithEstimate } from '../../../types'
import { asViewId } from '../../../types'
import { copyToClipboard } from '../../../utils/clipboard'
import { IconPlus, IconTrash, IconCheck, IconCopy, IconDuplicate, IconSettings, IconLink } from '../../../components/ui/Icons'
import { ViewEditor } from './ViewEditor'

interface ViewsListProps {
  project: ProjectWithEstimate
  editingViewId: ViewId | null
  editingViewName: string
  editingViewPassword: string
  isSavingView: boolean
  savedViewId: ViewId | null
  onAddView: () => void
  onStartEditing: (view: EstimateView) => void
  onCancelEditing: () => void
  onSaveView: (viewId: ViewId) => void
  onDuplicateView: (viewId: ViewId) => void
  onDeleteView: (viewId: ViewId, viewName: string) => void
  onSetCustomerView: (viewId: ViewId) => void
  onNameChange: (name: string) => void
  onPasswordChange: (password: string) => void
}

/**
 * Component for displaying and managing the list of estimate views
 * 
 * Shows all views for a project with options to:
 * - Add new views
 * - Edit view settings (name, password)
 * - Duplicate views
 * - Delete views
 * - Copy view links
 */
export function ViewsList({
  project,
  editingViewId,
  editingViewName,
  editingViewPassword,
  isSavingView,
  savedViewId,
  onAddView,
  onStartEditing,
  onCancelEditing,
  onSaveView,
  onDuplicateView,
  onDeleteView,
  onSetCustomerView,
  onNameChange,
  onPasswordChange,
}: ViewsListProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const copyLink = async (view: EstimateView) => {
    const url = `${window.location.origin}/v/${view.linkToken}`
    const success = await copyToClipboard(url)
    if (success) {
      setCopiedLink(view.id)
      setTimeout(() => setCopiedLink(null), 2000)
    } else {
      prompt('Скопируйте ссылку:', url)
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <IconLink className="w-5 h-5 text-slate-400" />
          Представления и ссылки
        </h2>
        <button
          onClick={onAddView}
          className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      <div className="space-y-3">
        {project.views.map(view => (
          <div key={view.id} className="rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
            {editingViewId === view.id ? (
              <ViewEditor
                viewId={asViewId(view.id)}
                name={editingViewName}
                password={editingViewPassword}
                isSaving={isSavingView}
                onNameChange={onNameChange}
                onPasswordChange={onPasswordChange}
                onSave={onSaveView}
                onCancel={onCancelEditing}
              />
            ) : (
              <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">{view.name}</span>
                    {view.isCustomerView && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                        Смета для заказчика
                      </span>
                    )}
                    {view.password && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        🔒 Защищено
                      </span>
                    )}
                    {savedViewId === asViewId(view.id) && (
                      <span className="text-xs text-green-400 animate-pulse">Сохранено!</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {window.location.origin}/v/{view.linkToken}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {!view.isCustomerView && (
                    <button
                      onClick={() => onSetCustomerView(asViewId(view.id))}
                      className="p-2 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all text-xs"
                      title="Отметить как смету для заказчика"
                    >
                      Отметить для заказчика
                    </button>
                  )}
                  <button
                    onClick={() => copyLink(view)}
                    className={`p-2 rounded-lg transition-all text-sm ${
                      copiedLink === view.id
                        ? 'bg-green-500/20 text-green-400'
                        : 'text-slate-400 hover:text-primary-400 hover:bg-primary-500/10'
                    }`}
                    title="Скопировать ссылку"
                  >
                    {copiedLink === view.id ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onDuplicateView(asViewId(view.id))}
                    className="p-2 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                    title="Дублировать"
                  >
                    <IconDuplicate className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStartEditing(view)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    title="Настроить"
                  >
                    <IconSettings className="w-4 h-4" />
                  </button>
                  {project.views.length > 1 && (
                    <button
                      onClick={() => onDeleteView(asViewId(view.id), view.name)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Удалить"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Каждое представление — это отдельный взгляд на смету со своими ценами и видимостью позиций. Настройте цены и видимость на странице сметы.
      </p>
    </div>
  )
}

