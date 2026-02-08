import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { projectsApi, EstimateData } from '../services/api'
import EstimateTable from '../components/EstimateTable'

export default function MasterView() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<EstimateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Password gate state
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [estimateTitle, setEstimateTitle] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (token) {
      loadEstimate(token)
    }
  }, [token])

  const loadEstimate = async (linkToken: string) => {
    try {
      const res = await projectsApi.getMasterView(linkToken)
      if (res.data.requiresPassword) {
        setRequiresPassword(true)
        setEstimateTitle(res.data.title)
      } else {
        setData(res.data)
      }
    } catch {
      setError('Смета не найдена или ссылка недействительна')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !password.trim()) return

    setIsVerifying(true)
    setPasswordError('')

    try {
      const res = await projectsApi.verifyMasterPassword(token, password.trim())
      setData(res.data)
      setRequiresPassword(false)
    } catch (err: any) {
      if (err.response?.status === 403) {
        setPasswordError('Неверная кодовая фраза. Попробуйте ещё раз.')
      } else {
        setPasswordError('Ошибка проверки. Попробуйте позже.')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="card text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Ошибка</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  // Password gate screen
  if (requiresPassword && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="card max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-1">Доступ ограничен</h1>
            <p className="text-slate-400 text-sm">
              {estimateTitle && <span className="block text-slate-300 font-medium mb-1">{estimateTitle}</span>}
              Для просмотра сметы введите кодовую фразу
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
                placeholder="Введите кодовую фразу..."
                className="input-field w-full text-center text-lg tracking-wide"
                autoFocus
                autoComplete="off"
              />
            </div>
            
            {passwordError && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Проверка...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Открыть смету
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="card text-center max-w-md">
          <h1 className="text-xl font-semibold text-white mb-2">Ошибка</h1>
          <p className="text-slate-400">Смета не найдена</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/95 sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <div>
            <h1 className="font-display text-lg sm:text-xl font-semibold text-white">{data.title}</h1>
            <p className="text-xs sm:text-sm text-accent-400">Смета для мастеров</p>
          </div>
          <button
            onClick={() => window.print()}
            className="btn-secondary text-sm py-2"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Печать
            </span>
          </button>
        </div>
      </header>

      {/* Print header */}
      <div className="hidden print:block p-8 text-center border-b">
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <p className="text-gray-500">Смета для мастеров</p>
      </div>

      <main className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-3 sm:py-8">
        <EstimateTable data={data} variant="master" />
      </main>
    </div>
  )
}
