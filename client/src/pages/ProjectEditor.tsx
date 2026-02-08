import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { projectsApi, Project, EstimateView } from '../services/api'

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Copy link state
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // View editing
  const [editingViewId, setEditingViewId] = useState<string | null>(null)
  const [editingViewName, setEditingViewName] = useState('')
  const [editingViewPassword, setEditingViewPassword] = useState('')
  const [isSavingView, setIsSavingView] = useState(false)
  const [savedViewId, setSavedViewId] = useState<string | null>(null)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (id) loadProject(id)
  }, [id])

  const loadProject = async (projectId: string) => {
    try {
      const res = await projectsApi.getOne(projectId)
      setProject(res.data)
    } catch {
      setError('Ошибка загрузки проекта')
    } finally {
      setIsLoading(false)
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

  const copyLink = async (view: EstimateView) => {
    const url = `${window.location.origin}/v/${view.linkToken}`
    
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
      setCopiedLink(view.id)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      prompt('Скопируйте ссылку:', url)
    }
  }

  const startEditingView = (view: EstimateView) => {
    setEditingViewId(view.id)
    setEditingViewName(view.name)
    setEditingViewPassword(view.password || '')
  }

  const cancelEditingView = () => {
    setEditingViewId(null)
    setEditingViewName('')
    setEditingViewPassword('')
  }

  const handleSaveView = async (viewId: string) => {
    if (!id || !project) return
    setIsSavingView(true)
    try {
      const res = await projectsApi.updateView(id, viewId, {
        name: editingViewName.trim(),
        password: editingViewPassword.trim(),
      })
      setProject({
        ...project,
        views: project.views.map(v => v.id === viewId ? res.data : v),
      })
      setEditingViewId(null)
      setSavedViewId(viewId)
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => setSavedViewId(null), 2000)
    } catch {
      setError('Ошибка сохранения представления')
    } finally {
      setIsSavingView(false)
    }
  }

  const handleAddView = async () => {
    if (!id || !project) return
    try {
      const res = await projectsApi.createView(id, 'Новое представление')
      setProject({ ...project, views: [...project.views, res.data] })
      startEditingView(res.data)
    } catch {
      setError('Ошибка создания представления')
    }
  }

  const handleDuplicateView = async (viewId: string) => {
    if (!id || !project) return
    try {
      const res = await projectsApi.duplicateView(id, viewId)
      setProject({ ...project, views: [...project.views, res.data] })
    } catch {
      setError('Ошибка дублирования представления')
    }
  }

  const handleDeleteView = async (viewId: string, viewName: string) => {
    if (!id || !project) return
    if (project.views.length <= 1) {
      setError('Нельзя удалить последнее представление')
      return
    }
    if (!confirm(`Удалить представление "${viewName}"? Все настройки цен и видимости для этого представления будут потеряны.`)) return
    try {
      await projectsApi.deleteView(id, viewId)
      setProject({ ...project, views: project.views.filter(v => v.id !== viewId) })
      if (editingViewId === viewId) cancelEditingView()
    } catch {
      setError('Ошибка удаления представления')
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
        <h1 className="font-display text-2xl font-bold text-white">{project.title}</h1>
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
          <span className="text-sm text-slate-400">Открыть →</span>
        </Link>

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
          <span className="text-sm text-slate-400">Открыть →</span>
        </Link>

        <Link
          to={`/projects/${id}/acts`}
          className="card group hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">Акты работ</h3>
              <p className="text-xs text-slate-500">История и создание актов</p>
            </div>
          </div>
          <span className="text-sm text-slate-400">Открыть →</span>
        </Link>
      </div>

      {/* Views / Public Links */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Представления и ссылки
          </h2>
          <button
            onClick={handleAddView}
            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить
          </button>
        </div>

        <div className="space-y-3">
          {project.views.map(view => (
            <div key={view.id} className="rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
              {editingViewId === view.id ? (
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Название</label>
                    <input
                      type="text"
                      value={editingViewName}
                      onChange={(e) => setEditingViewName(e.target.value)}
                      className="input-field text-sm py-2 w-full"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Кодовая фраза (пусто = без защиты)</label>
                    <input
                      type="text"
                      value={editingViewPassword}
                      onChange={(e) => setEditingViewPassword(e.target.value)}
                      placeholder="Не установлена"
                      className="input-field text-sm py-2 w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveView(view.id)}
                      disabled={isSavingView || !editingViewName.trim()}
                      className="btn-primary text-sm py-1.5 px-4"
                    >
                      {isSavingView ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={cancelEditingView}
                      className="btn-secondary text-sm py-1.5 px-4"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{view.name}</span>
                      {view.password && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          🔒 Защищено
                        </span>
                      )}
                      {savedViewId === view.id && (
                        <span className="text-xs text-green-400 animate-pulse">Сохранено!</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {window.location.origin}/v/{view.linkToken}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => copyLink(view)}
                      className={`p-2 rounded-lg transition-all text-sm ${
                        copiedLink === view.id
                          ? 'bg-green-500/20 text-green-400'
                          : 'text-slate-400 hover:text-primary-400 hover:bg-primary-500/10'
                      }`}
                      title="Скопировать ссылку"
                    >
                      {copiedLink === view.id ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDuplicateView(view.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                      title="Дублировать"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => startEditingView(view)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                      title="Настроить"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    {project.views.length > 1 && (
                      <button
                        onClick={() => handleDeleteView(view.id, view.name)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Удалить"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
