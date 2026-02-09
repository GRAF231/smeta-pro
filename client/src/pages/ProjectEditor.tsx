import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import type { ViewId } from '../types'
import { useProject } from '../hooks/useProject'
import { useProjects } from '../hooks/api/useProjects'
import { useEstimateViews } from '../hooks/api/useEstimateViews'
import { getProjectIdFromParams } from '../utils/params'
import { PageSpinner } from '../components/ui/Spinner'
import { useToast } from '../components/ui/ToastContainer'
import BackButton from '../components/ui/BackButton'
import { useViewEditor } from './ProjectEditor/hooks/useViewEditor'
import { ViewsList } from './ProjectEditor/components/ViewsList'
import { ProjectNavigationCards } from './ProjectEditor/components/ProjectNavigationCards'
import { ProjectSettings } from './ProjectEditor/components/ProjectSettings'

/**
 * Project editor page component
 * 
 * Allows editing project settings and managing estimate views:
 * - Create, edit, duplicate, and delete views
 * - Set passwords for views
 * - Copy view links
 * - Navigate to estimate, materials, and acts pages
 * - Delete project
 * 
 * @example
 * Used as a route in App.tsx:
 * ```tsx
 * <Route path="projects/:id/edit" element={<ProjectEditor />} />
 * ```
 */
export default function ProjectEditor() {
  const params = useParams<{ id: string }>()
  const id = getProjectIdFromParams(params)
  const navigate = useNavigate()
  const { project, isLoading, error, setError, setProject } = useProject(id)
  const { deleteProject } = useProjects()
  const { createView, updateView, duplicateView, deleteView: deleteViewHook } = useEstimateViews(id)
  const { showError } = useToast()

  const {
    editingViewId,
    editingViewName,
    editingViewPassword,
    isSavingView,
    savedViewId,
    startEditingView,
    cancelEditingView,
    setEditingViewName,
    setEditingViewPassword,
    setIsSavingView,
    setSavedViewId,
    clearSavedViewId,
  } = useViewEditor()

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Вы уверены, что хотите удалить этот проект? Все данные будут потеряны.')) return
    try {
      await deleteProject(id)
      navigate('/dashboard')
    } catch {
      // Error is handled by hook
    }
  }

  const handleSaveView = async (viewId: ViewId) => {
    if (!id || !project) return
    setIsSavingView(true)
    try {
      const updatedView = await updateView(viewId, {
        name: editingViewName.trim(),
        password: editingViewPassword.trim(),
      })
      if (updatedView) {
        setProject({ ...project, views: project.views.map(v => v.id === viewId ? updatedView : v) })
        cancelEditingView()
        setSavedViewId(viewId)
        clearSavedViewId()
      }
    } catch {
      // Error is handled by hook
    } finally {
      setIsSavingView(false)
    }
  }

  const handleAddView = async () => {
    if (!id || !project) return
    try {
      const newView = await createView('Новое представление')
      if (newView) {
        setProject({ ...project, views: [...project.views, newView] })
        startEditingView(newView)
      }
    } catch {
      // Error is handled by hook
    }
  }

  const handleDuplicateView = async (viewId: ViewId) => {
    if (!id || !project) return
    try {
      const duplicatedView = await duplicateView(viewId)
      if (duplicatedView) {
        setProject({ ...project, views: [...project.views, duplicatedView] })
      }
    } catch {
      // Error is handled by hook
    }
  }

  const handleDeleteView = async (viewId: ViewId, viewName: string) => {
    if (!id || !project) return
    if (project.views.length <= 1) {
      showError('Нельзя удалить последнее представление')
      return
    }
    if (!confirm(`Удалить представление "${viewName}"? Все настройки цен и видимости для этого представления будут потеряны.`)) {
      return
    }
    try {
      await deleteViewHook(viewId)
      setProject({ ...project, views: project.views.filter(v => v.id !== viewId) })
      if (editingViewId === viewId) cancelEditingView()
    } catch {
      // Error is handled by hook
    }
  }

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      showError(error)
      setError('')
    }
  }, [error, showError, setError])

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

      {id && <ProjectNavigationCards projectId={id} />}

      <ViewsList
        project={project}
        editingViewId={editingViewId}
        editingViewName={editingViewName}
        editingViewPassword={editingViewPassword}
        isSavingView={isSavingView}
        savedViewId={savedViewId}
        onAddView={handleAddView}
        onStartEditing={startEditingView}
        onCancelEditing={cancelEditingView}
        onSaveView={handleSaveView}
        onDuplicateView={handleDuplicateView}
        onDeleteView={handleDeleteView}
        onNameChange={setEditingViewName}
        onPasswordChange={setEditingViewPassword}
      />

      <ProjectSettings project={project} onDelete={handleDelete} />
    </div>
  )
}
