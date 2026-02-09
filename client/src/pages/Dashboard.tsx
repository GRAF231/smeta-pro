import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi, Project, EstimateView } from '../services/api'
import { copyToClipboard } from '../utils/clipboard'
import { PageSpinner } from '../components/ui/Spinner'
import ErrorAlert from '../components/ui/ErrorAlert'
import { IconPlus, IconEdit, IconTrash, IconCopy, IconCheck, IconDocument } from '../components/ui/Icons'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await projectsApi.getAll()
      setProjects(res.data)
    } catch {
      setError('Ошибка загрузки проектов')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) return
    try {
      await projectsApi.delete(id)
      setProjects(projects.filter(p => p.id !== id))
    } catch {
      setError('Ошибка удаления проекта')
    }
  }

  const copyViewLink = async (view: EstimateView) => {
    const url = `${window.location.origin}/v/${view.linkToken}`
    const success = await copyToClipboard(url)
    if (success) {
      setCopiedLink(view.id)
      setTimeout(() => setCopiedLink(null), 2000)
    } else {
      prompt('Скопируйте ссылку:', url)
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Мои проекты</h1>
        <div className="flex items-center gap-3">
          <Link to="/projects/generate" className="btn-secondary text-sm py-2.5 px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Из PDF (ИИ)
            </span>
          </Link>
          <Link to="/projects/new" className="btn-primary">
            <span className="flex items-center gap-2">
              <IconPlus className="w-5 h-5" />
              Новый проект
            </span>
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center">
            <IconDocument className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Пока нет проектов</h2>
          <p className="text-slate-400 mb-6">Создайте первый проект, подключив Google таблицу</p>
          <Link to="/projects/new" className="btn-primary inline-flex">
            Новый проект
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="card animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-1">{project.title}</h2>
                  <p className="text-sm text-slate-500">
                    Создан: {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                    {project.views && project.views.length > 0 && (
                      <span className="ml-2 text-slate-600">
                        • {project.views.length} {project.views.length === 1 ? 'представление' : project.views.length < 5 ? 'представления' : 'представлений'}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.views && project.views.slice(0, 3).map(view => (
                      <button
                        key={view.id}
                        onClick={() => copyViewLink(view)}
                        className="btn-secondary text-sm py-2 px-3"
                        title={`Скопировать ссылку: ${view.name}`}
                      >
                        {copiedLink === view.id ? (
                          <span className="flex items-center gap-1.5 text-green-400">
                            <IconCheck className="w-4 h-4" />
                            Скопировано
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <IconCopy className="w-4 h-4" />
                            {view.name}
                          </span>
                        )}
                      </button>
                    ))}
                    {project.views && project.views.length > 3 && (
                      <span className="text-xs text-slate-500 self-center">+{project.views.length - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${project.id}/edit`}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <IconEdit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <IconTrash className="w-5 h-5" />
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
