import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi } from '../services/api'
import { PageSpinner } from '../components/ui/Spinner'
import ErrorAlert from '../components/ui/ErrorAlert'
import Spinner from '../components/ui/Spinner'

export default function ProjectForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  
  const [title, setTitle] = useState('')
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(isEdit)
  
  const navigate = useNavigate()

  useEffect(() => {
    if (isEdit && id) {
      loadProject(id)
    }
  }, [id, isEdit])

  const loadProject = async (projectId: string) => {
    try {
      const res = await projectsApi.getOne(projectId)
      setTitle(res.data.title)
      setGoogleSheetUrl(`https://docs.google.com/spreadsheets/d/${res.data.googleSheetId}`)
    } catch {
      setError('Ошибка загрузки проекта')
    } finally {
      setIsLoadingData(false)
    }
  }

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
        await projectsApi.update(id, data)
      } else {
        await projectsApi.create(data)
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Ошибка сохранения проекта')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return <PageSpinner />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-white mb-8">
          {isEdit ? 'Редактировать проект' : 'Новый проект'}
        </h1>

        <ErrorAlert message={error} onClose={() => setError('')} />

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

