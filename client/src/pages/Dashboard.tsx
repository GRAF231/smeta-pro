import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { estimatesApi, Estimate } from '../services/api'

export default function Dashboard() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  useEffect(() => {
    loadEstimates()
  }, [])

  const loadEstimates = async () => {
    try {
      const res = await estimatesApi.getAll()
      setEstimates(res.data)
    } catch {
      setError('Ошибка загрузки смет')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту смету?')) return
    
    try {
      await estimatesApi.delete(id)
      setEstimates(estimates.filter(e => e.id !== id))
    } catch {
      setError('Ошибка удаления сметы')
    }
  }

  const copyLink = async (token: string, type: 'customer' | 'master') => {
    const path = type === 'customer' ? '/c/' : '/m/'
    const url = `${window.location.origin}${path}${token}`
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for HTTP
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedLink(`${type}-${token}`)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Show URL in prompt as last resort
      prompt('Скопируйте ссылку:', url)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Мои сметы</h1>
        <div className="flex items-center gap-3">
          <Link 
            to="/estimates/generate" 
            className="btn-secondary text-sm py-2.5 px-4"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Из PDF (ИИ)
            </span>
          </Link>
          <Link to="/estimates/new" className="btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить смету
            </span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {estimates.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Пока нет смет</h2>
          <p className="text-slate-400 mb-6">Создайте первую смету, подключив Google таблицу</p>
          <Link to="/estimates/new" className="btn-primary inline-flex">
            Добавить смету
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {estimates.map((estimate, i) => (
            <div 
              key={estimate.id} 
              className="card animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-1">{estimate.title}</h2>
                  <p className="text-sm text-slate-500">
                    Создана: {new Date(estimate.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(estimate.customerLinkToken, 'customer')}
                      className="btn-secondary text-sm py-2 px-4"
                    >
                      {copiedLink === `customer-${estimate.customerLinkToken}` ? (
                        <span className="flex items-center gap-1.5 text-green-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Скопировано
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Для заказчика
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => copyLink(estimate.masterLinkToken, 'master')}
                      className="btn-secondary text-sm py-2 px-4"
                    >
                      {copiedLink === `master-${estimate.masterLinkToken}` ? (
                        <span className="flex items-center gap-1.5 text-green-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Скопировано
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Для мастеров
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/estimates/${estimate.id}/edit`}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(estimate.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

