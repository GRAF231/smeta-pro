import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi } from '../services/api'

export default function AiEstimateGenerator() {
  const [title, setTitle] = useState('')
  const [pricelistUrl, setPricelistUrl] = useState('')
  const [comments, setComments] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setError('')
    } else {
      setError('Допускаются только PDF файлы')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile(file)
        setError('')
      } else {
        setError('Допускаются только PDF файлы')
      }
    }
  }

  const removePdf = () => {
    setPdfFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' Б'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!pdfFile) {
      setError('Загрузите PDF файл с дизайн-проектом')
      return
    }

    if (!title.trim()) {
      setError('Укажите название сметы')
      return
    }

    if (!pricelistUrl.trim()) {
      setError('Укажите ссылку на прайс-лист')
      return
    }

    setIsLoading(true)
    setProgress('Загрузка PDF и конвертация страниц в изображения...')

    try {
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      formData.append('title', title.trim())
      formData.append('pricelistUrl', pricelistUrl.trim())
      formData.append('comments', comments.trim())

      // Update progress after a delay (server processes PDF first, then sends to AI)
      setTimeout(() => setProgress('ИИ анализирует изображения дизайн-проекта...'), 5000)
      setTimeout(() => setProgress('ИИ составляет смету на основе прайс-листа...'), 30000)
      setTimeout(() => setProgress('Почти готово, финализация сметы...'), 90000)

      const res = await projectsApi.generateFromPdf(formData)
      
      // Redirect to project editor
      navigate(`/projects/${res.data.id}/edit`)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Ошибка генерации сметы. Попробуйте снова.')
    } finally {
      setIsLoading(false)
      setProgress('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Генерация сметы через ИИ
            </h1>
            <p className="text-sm text-slate-400">
              Загрузите дизайн-проект в PDF и получите готовую смету
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
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
              disabled={isLoading}
            />
          </div>

          {/* PDF Upload */}
          <div>
            <label className="label">PDF дизайн-проект</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />

            {!pdfFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragOver 
                    ? 'border-purple-400 bg-purple-500/10' 
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
                  }
                `}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm text-slate-300 mb-1">
                  Перетащите PDF файл сюда или нажмите для выбора
                </p>
                <p className="text-xs text-slate-500">
                  Максимальный размер: 100 МБ
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{pdfFile.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(pdfFile.size)}</p>
                </div>
                {!isLoading && (
                  <button
                    type="button"
                    onClick={removePdf}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pricelist URL */}
          <div>
            <label htmlFor="pricelistUrl" className="label">Ссылка на прайс-лист (Google Таблица)</label>
            <input
              type="url"
              id="pricelistUrl"
              value={pricelistUrl}
              onChange={(e) => setPricelistUrl(e.target.value)}
              className="input-field"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              required
              disabled={isLoading}
            />
            <p className="mt-2 text-sm text-slate-500">
              Таблица с ценами на работы. Формат произвольный — ИИ сам определит структуру.
            </p>
          </div>

          {/* Comments */}
          <div>
            <label htmlFor="comments" className="label">
              Уточняющие комментарии
              <span className="text-slate-500 font-normal ml-1">(необязательно)</span>
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="Например: квартира 60 кв.м., 2 комнаты, бюджет средний, нужна полная замена электрики..."
              disabled={isLoading}
            />
          </div>

          {/* Info block */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Как это работает
            </h3>
            <div className="text-sm space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-medium mt-0.5">1.</span>
                <span>ИИ извлекает информацию о помещениях и работах из дизайн-проекта</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-medium mt-0.5">2.</span>
                <span>Сопоставляет необходимые работы с позициями из вашего прайс-листа</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-medium mt-0.5">3.</span>
                <span>Оценивает объёмы и формирует смету по разделам</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-medium mt-0.5">4.</span>
                <span>Вы можете отредактировать результат в редакторе смет</span>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          {isLoading && progress && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500/30"></div>
                  <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-300">{progress}</p>
                  <p className="text-xs text-purple-400/70 mt-0.5">Это может занять до 2-5 минут для больших документов</p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !pdfFile}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Генерация...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Сгенерировать смету
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

