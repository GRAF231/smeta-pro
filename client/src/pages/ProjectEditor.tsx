import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { projectsApi, Project } from '../services/api'

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Master password state
  const [masterPassword, setMasterPassword] = useState('')
  const [masterPasswordInput, setMasterPasswordInput] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const passwordTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Copy link state
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadProject(id)
  }, [id])

  const loadProject = async (projectId: string) => {
    try {
      const res = await projectsApi.getOne(projectId)
      setProject(res.data)
      setMasterPassword(res.data.masterPassword || '')
      setMasterPasswordInput(res.data.masterPassword || '')
    } catch {
      setError('Ошибка загрузки проекта')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveMasterPassword = async () => {
    if (!id) return
    setIsSavingPassword(true)
    try {
      await projectsApi.setMasterPassword(id, masterPasswordInput.trim())
      setMasterPassword(masterPasswordInput.trim())
      setPasswordSaved(true)
      if (passwordTimeoutRef.current) clearTimeout(passwordTimeoutRef.current)
      passwordTimeoutRef.current = setTimeout(() => setPasswordSaved(false), 2000)
    } catch {
      setError('Ошибка сохранения кодовой фразы')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Вы уверены, что хотите удалить этот проект? Все данные будут потеряны.')) return
    try {
      await projectsApi.delete(id)
      navigate('/dashboard')
    } catch {
      setError('Ошибка удаления проекта')
    }
  }

  const copyLink = async (token: string, type: 'customer' | 'master') => {
    const path = type === 'customer' ? '/c/' : '/m/'
    const url = `${window.location.origin}${path}${token}`
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
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

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400">{error || 'Проект не найден'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к проектам
        </button>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-white">{project.title}</h1>
          <Link
            to={`/projects/${id}/settings`}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
            onClick={(e) => { e.preventDefault(); navigate(`/projects/new`, { state: { editId: id } }) }}
          >
            {/* Hidden, we use the inline settings below */}
          </Link>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Создан: {new Date(project.createdAt).toLocaleDateString('ru-RU')}
          {project.googleSheetId && ' • Подключена Google Таблица'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-red-300">✕</button>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Смета */}
        <Link
          to={`/projects/${id}/estimate`}
          className="card group hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">Смета</h3>
              <p className="text-xs text-slate-500">Разделы и позиции работ</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Открыть →</span>
          </div>
        </Link>

        {/* Материалы */}
        <Link
          to={`/projects/${id}/materials`}
          className="card group hover:border-accent-500/50 transition-all hover:shadow-lg hover:shadow-accent-500/5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center group-hover:bg-accent-500/30 transition-colors">
              <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-accent-300 transition-colors">Материалы</h3>
              <p className="text-xs text-slate-500">Список материалов и цены</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Открыть →</span>
          </div>
        </Link>

        {/* Акты */}
        <Link
          to={`/projects/${id}/act`}
          className="card group hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">Акт работ</h3>
              <p className="text-xs text-slate-500">Генерация акта выполненных работ</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Открыть →</span>
          </div>
        </Link>
      </div>

      {/* Public Links */}
      <div className="card mb-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Публичные ссылки
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => copyLink(project.customerLinkToken, 'customer')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500/10 border border-primary-500/20 hover:bg-primary-500/20 transition-all text-sm"
          >
            {copiedLink === `customer-${project.customerLinkToken}` ? (
              <span className="flex items-center gap-1.5 text-green-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Скопировано!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-primary-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Ссылка для заказчика
              </span>
            )}
          </button>
          <button
            onClick={() => copyLink(project.masterLinkToken, 'master')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-500/10 border border-accent-500/20 hover:bg-accent-500/20 transition-all text-sm"
          >
            {copiedLink === `master-${project.masterLinkToken}` ? (
              <span className="flex items-center gap-1.5 text-green-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Скопировано!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-accent-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Ссылка для мастеров
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Master password */}
      <div className="card mb-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Кодовая фраза для сметы мастера
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={masterPasswordInput}
            onChange={(e) => { setMasterPasswordInput(e.target.value); setPasswordSaved(false) }}
            placeholder="Не установлена (смета открыта без пароля)"
            className="input-field flex-1 text-sm py-2"
          />
          <button
            onClick={handleSaveMasterPassword}
            disabled={isSavingPassword || masterPasswordInput === masterPassword}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all whitespace-nowrap ${
              passwordSaved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : masterPasswordInput !== masterPassword
                  ? 'bg-accent-500 text-white hover:bg-accent-600'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSavingPassword ? 'Сохранение...' : passwordSaved ? 'Сохранено!' : 'Сохранить'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {masterPassword
            ? 'Мастеру потребуется ввести эту фразу, чтобы открыть смету. Оставьте поле пустым и сохраните, чтобы снять защиту.'
            : 'Введите кодовую фразу, чтобы защитить смету мастера от случайного просмотра заказчиком.'}
        </p>
      </div>

      {/* Google Sheet & Danger Zone */}
      <div className="grid sm:grid-cols-2 gap-4">
        {project.googleSheetId && (
          <div className="card">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Google Таблица
            </h2>
            <p className="text-xs text-slate-500 mb-3 break-all">
              ID: {project.googleSheetId}
            </p>
            <a
              href={`https://docs.google.com/spreadsheets/d/${project.googleSheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              Открыть таблицу
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        )}

        <div className={`card border-red-500/20 ${!project.googleSheetId ? 'sm:col-span-2' : ''}`}>
          <h2 className="font-semibold text-red-400 mb-2">Опасная зона</h2>
          <p className="text-xs text-slate-500 mb-3">
            Удаление проекта невозможно отменить. Все данные будут потеряны.
          </p>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
          >
            Удалить проект
          </button>
        </div>
      </div>
    </div>
  )
}
