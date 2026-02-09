import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '../hooks/useProject'
import ActGenerator from '../components/ActGenerator'
import { PageSpinner } from '../components/ui/Spinner'
import { IconBack, IconDocument } from '../components/ui/Icons'
import { getProjectIdFromParams } from '../utils/params'

/**
 * Act page component
 * 
 * Displays the act generator interface for creating acts of completed work.
 * Loads project data and provides act generation functionality.
 * 
 * @example
 * Used as a route in App.tsx:
 * ```tsx
 * <Route path="projects/:id/acts" element={<ActPage />} />
 * ```
 */
export default function ActPage() {
  const params = useParams<{ id: string }>()
  const id = getProjectIdFromParams(params)
  const navigate = useNavigate()
  const { project, isLoading, error } = useProject(id)

  if (isLoading) {
    return <PageSpinner />
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
        <button onClick={() => navigate(`/projects/${id}/acts`)} className="text-slate-400 hover:text-white mb-4 flex items-center gap-1">
          <IconBack className="w-4 h-4" />
          Назад к актам
        </button>
        <div className="card text-center py-12">
          <IconDocument className="w-16 h-16 mx-auto mb-4 text-slate-600" />
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
      views={project.views}
      onBack={() => navigate(`/projects/${id}/acts`)}
    />
  )
}

