import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { projectsApi, Project, EstimateView } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'
import { PageSpinner } from '../components/ui/Spinner'
import ErrorAlert from '../components/ui/ErrorAlert'
import BackButton from '../components/ui/BackButton'
import { IconPlus, IconTrash, IconCheck, IconCopy, IconDuplicate, IconSettings, IconLink, IconCalculator, IconBox, IconDocument, IconExternalLink } from '../components/ui/Icons'

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
    const success = await copyToClipboard(url)
    if (success) {
      setCopiedLink(view.id)
      setTimeout(() => setCopiedLink(null), 2000)
    } else {
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
      setProject({ ...project, views: project.views.map(v => v.id === viewId ? res.data : v) })
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
    if (project.views.length <= 1) { setError('Нельзя удалить последнее представление'); return }
    if (!confirm(`Удалить представление "${viewName}"? Все настройки цен и видимости для этого представления будут потеряны.`)) return
    try {
      await projectsApi.deleteView(id, viewId)
      setProject({ ...project, views: project.views.filter(v => v.id !== viewId) })
      if (editingViewId === viewId) cancelEditingView()
    } catch {
      setError('Ошибка удаления представления')
    }
  }

  if (isLoading) return <PageSpinner />

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
        <BackButton to="/dashboard" label="Назад к проектам" />
        <h1 className="font-display text-2xl font-bold text-white">{project.title}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Создан: {new Date(project.createdAt).toLocaleDateString('ru-RU')}
          {project.googleSheetId && ' • Подключена Google Таблица'}
        </p>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link to={`/projects/${id}/estimate`} className="card group hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
              <IconCalculator className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">Смета</h3>
              <p className="text-xs text-slate-500">Разделы и позиции работ</p>
            </div>
          </div>
          <span className="text-sm text-slate-400">Открыть →</span>
        </Link>

        <Link to={`/projects/${id}/materials`} className="card group hover:border-accent-500/50 transition-all hover:shadow-lg hover:shadow-accent-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center group-hover:bg-accent-500/30 transition-colors">
              <IconBox className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-accent-300 transition-colors">Материалы</h3>
              <p className="text-xs text-slate-500">Список материалов и цены</p>
            </div>
          </div>
          <span className="text-sm text-slate-400">Открыть →</span>
        </Link>

        <Link to={`/projects/${id}/acts`} className="card group hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <IconDocument className="w-5 h-5 text-emerald-400" />
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
            <IconLink className="w-5 h-5 text-slate-400" />
            Представления и ссылки
          </h2>
          <button onClick={handleAddView} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            <IconPlus className="w-4 h-4" />
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
                    <input type="text" value={editingViewName} onChange={(e) => setEditingViewName(e.target.value)} className="input-field text-sm py-2 w-full" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Кодовая фраза (пусто = без защиты)</label>
                    <input type="text" value={editingViewPassword} onChange={(e) => setEditingViewPassword(e.target.value)} placeholder="Не установлена" className="input-field text-sm py-2 w-full" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveView(view.id)} disabled={isSavingView || !editingViewName.trim()} className="btn-primary text-sm py-1.5 px-4">
                      {isSavingView ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button onClick={cancelEditingView} className="btn-secondary text-sm py-1.5 px-4">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{view.name}</span>
                      {view.password && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">🔒 Защищено</span>
                      )}
                      {savedViewId === view.id && (
                        <span className="text-xs text-green-400 animate-pulse">Сохранено!</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{window.location.origin}/v/{view.linkToken}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => copyLink(view)}
                      className={`p-2 rounded-lg transition-all text-sm ${
                        copiedLink === view.id ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-primary-400 hover:bg-primary-500/10'
                      }`}
                      title="Скопировать ссылку"
                    >
                      {copiedLink === view.id ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDuplicateView(view.id)} className="p-2 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all" title="Дублировать">
                      <IconDuplicate className="w-4 h-4" />
                    </button>
                    <button onClick={() => startEditingView(view)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="Настроить">
                      <IconSettings className="w-4 h-4" />
                    </button>
                    {project.views.length > 1 && (
                      <button onClick={() => handleDeleteView(view.id, view.name)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Удалить">
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
            <p className="text-xs text-slate-500 mb-3 break-all">ID: {project.googleSheetId}</p>
            <a
              href={`https://docs.google.com/spreadsheets/d/${project.googleSheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              Открыть таблицу
              <IconExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className={`card border-red-500/20 ${!project.googleSheetId ? 'sm:col-span-2' : ''}`}>
          <h2 className="font-semibold text-red-400 mb-2">Опасная зона</h2>
          <p className="text-xs text-slate-500 mb-3">Удаление проекта невозможно отменить. Все данные будут потеряны.</p>
          <button onClick={handleDelete} className="px-4 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
            Удалить проект
          </button>
        </div>
      </div>
    </div>
  )
}
