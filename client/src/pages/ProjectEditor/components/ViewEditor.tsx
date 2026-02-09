import type { ViewId } from '../../../types'
import { asViewId } from '../../../types'

interface ViewEditorProps {
  viewId: ViewId
  name: string
  password: string
  isSaving: boolean
  onNameChange: (name: string) => void
  onPasswordChange: (password: string) => void
  onSave: (viewId: ViewId) => void
  onCancel: () => void
}

/**
 * Component for editing a single view's settings
 * 
 * Displays form fields for editing view name and password.
 * Used within ViewsList component when a view is in edit mode.
 */
export function ViewEditor({
  viewId,
  name,
  password,
  isSaving,
  onNameChange,
  onPasswordChange,
  onSave,
  onCancel,
}: ViewEditorProps) {
  return (
    <div className="p-4 space-y-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Название</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="input-field text-sm py-2 w-full"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Кодовая фраза (пусто = без защиты)</label>
        <input
          type="text"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Не установлена"
          className="input-field text-sm py-2 w-full"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(asViewId(viewId))}
          disabled={isSaving || !name.trim()}
          className="btn-primary text-sm py-1.5 px-4"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm py-1.5 px-4">
          Отмена
        </button>
      </div>
    </div>
  )
}

