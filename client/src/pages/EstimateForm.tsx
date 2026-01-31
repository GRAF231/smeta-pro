import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { estimatesApi } from '../services/api'

export default function EstimateForm() {
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
      loadEstimate(id)
    }
  }, [id, isEdit])

  const loadEstimate = async (estimateId: string) => {
    try {
      const res = await estimatesApi.getOne(estimateId)
      setTitle(res.data.title)
      setGoogleSheetUrl(`https://docs.google.com/spreadsheets/d/${res.data.googleSheetId}`)
    } catch {
      setError('Ошибка загрузки сметы')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isEdit && id) {
        await estimatesApi.update(id, { title, googleSheetUrl })
      } else {
        await estimatesApi.create({ title, googleSheetUrl })
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Ошибка сохранения сметы')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-white mb-8">
          {isEdit ? 'Редактировать смету' : 'Новая смета'}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="label">Название сметы</label>
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
            <label htmlFor="googleSheetUrl" className="label">Ссылка на Google Таблицу</label>
            <input
              type="url"
              id="googleSheetUrl"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              className="input-field"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              required
            />
            <p className="mt-2 text-sm text-slate-500">
              Убедитесь, что таблица открыта для сервисного аккаунта или по ссылке
            </p>
          </div>

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
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Сохранение...
                </span>
              ) : (
                isEdit ? 'Сохранить изменения' : 'Создать смету'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

