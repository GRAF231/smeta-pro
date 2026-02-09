import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjects } from '../hooks/api/useProjects'
import { useProject } from '../hooks/useProject'
import { PageSpinner } from '../components/ui/Spinner'
import { useToast } from '../components/ui/ToastContainer'
import Spinner from '../components/ui/Spinner'
import { getProjectIdFromParams } from '../utils/params'

/**
 * Project form page component
 * 
 * Handles both creating new projects and editing existing ones.
 * Supports optional Google Sheets integration.
 * 
 * @example
 * Used as routes in App.tsx:
 * ```tsx
 * <Route path="projects/new" element={<ProjectForm />} />
 * <Route path="projects/:id/edit" element={<ProjectForm />} />
 * ```
 */
export default function ProjectForm() {
  const params = useParams<{ id?: string }>()
  const id = params.id ? getProjectIdFromParams(params) : undefined
  const isEdit = Boolean(id)
  
  const [title, setTitle] = useState('')
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  const { project, isLoading: isLoadingData, error: projectError } = useProject(id)
  const { createProject, updateProject } = useProjects()
  const { showError } = useToast()

  useEffect(() => {
    if (project && isEdit) {
      setTitle(project.title)
      if (project.googleSheetId) {
        setGoogleSheetUrl(`https://docs.google.com/spreadsheets/d/${project.googleSheetId}`)
      }
    }
  }, [project, isEdit])

  useEffect(() => {
    if (projectError) {
      setError(projectError)
    }
  }, [projectError])

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      showError(error)
      setError('')
    }
  }, [error, showError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data: { title: string; googleSheetUrl?: string } = { title }
      if (googleSheetUrl.trim()) {
        data.googleSheetUrl = googleSheetUrl
      }

      if (isEdit && id) {
        await updateProject(id, data)
      } else {
        await createProject(data)
      }
      navigate('/dashboard')
    } catch (err) {
      // Error is handled by hook
      showError('Ошибка сохранения проекта')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData && isEdit) {
    return <PageSpinner />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-white mb-8">
          {isEdit ? 'Редактировать проект' : 'Новый проект'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="label">Название проекта</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Например: Ремонт квартиры ул. Ленина 15"
              required
            />
          </div>

          <div>
            <label htmlFor="googleSheetUrl" className="label">
              Ссылка на Google Таблицу <span className="text-slate-500 font-normal">(необязательно)</span>
            </label>
            <input
              type="url"
              id="googleSheetUrl"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              className="input-field"
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            <p className="mt-2 text-sm text-slate-500">
              Можно создать проект без таблицы и заполнить смету вручную, либо подключить Google Таблицу для автоимпорта
            </p>
          </div>

          {googleSheetUrl.trim() && (
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h3 className="font-medium text-white mb-3">Структура таблицы</h3>
              <p className="text-sm text-slate-400 mb-3">
                Сервис ожидает следующую структуру колонок:
              </p>
              <div className="text-sm space-y-1 text-slate-300">
                <div><span className="text-slate-500">A:</span> Номер / Раздел</div>
                <div><span className="text-slate-500">B:</span> Наименование работ</div>
                <div><span className="text-slate-500">C:</span> Единица измерения</div>
                <div><span className="text-slate-500">D:</span> Количество</div>
                <div><span className="text-slate-500">E:</span> Цена (продажная)</div>
                <div><span className="text-primary-400 font-medium">F:</span> <span className="text-primary-400">Сумма для заказчика</span></div>
                <div><span className="text-slate-500">H:</span> Закупочная цена</div>
                <div><span className="text-accent-400 font-medium">I:</span> <span className="text-accent-400">Сумма для мастеров</span></div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Сохранение...
                </span>
              ) : (
                isEdit ? 'Сохранить изменения' : 'Создать проект'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

