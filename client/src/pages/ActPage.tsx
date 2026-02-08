import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, ProjectWithEstimate } from '../services/api'
import ActGenerator from '../components/ActGenerator'

export default function ActPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectWithEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400">{error || 'Проект не найден'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-primary-400 hover:text-primary-300"
        >
          Вернуться к проектам
        </button>
      </div>
    )
  }

  if (project.sections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(`/projects/${id}/edit`)} className="text-slate-400 hover:text-white mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к проекту
        </button>
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="font-display text-xl font-bold text-white mb-2">Смета пуста</h2>
          <p className="text-slate-400 mb-6">Для создания акта нужно сначала добавить разделы и позиции в смету.</p>
          <button
            onClick={() => navigate(`/projects/${id}/estimate`)}
            className="btn-primary"
          >
            Перейти к смете
          </button>
        </div>
      </div>
    )
  }

  return (
    <ActGenerator
      projectId={id!}
      sections={project.sections}
      onBack={() => navigate(`/projects/${id}/edit`)}
    />
  )
}

