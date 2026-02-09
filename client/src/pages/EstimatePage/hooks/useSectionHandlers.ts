import { projectsApi } from '../../../services/api'
import type { ProjectWithEstimate, EstimateSection, ProjectId, ViewId, SectionId } from '../../../types'

interface UseSectionHandlersProps {
  projectId: ProjectId | undefined
  project: ProjectWithEstimate | null
  setProject: (project: ProjectWithEstimate | null) => void
  activeViewId: ViewId | null
  setError: (error: string) => void
  newSectionName: string
  setNewSectionName: (name: string) => void
  setIsAddingSection: (adding: boolean) => void
  setShowAddSection: (show: boolean) => void
  editingSectionName: string
  setEditingSectionId: (id: SectionId | null) => void
  setEditingSectionName: (name: string) => void
  loadProject: (id: ProjectId) => Promise<void>
}

/**
 * Hook for section-related handlers (add, delete, rename, visibility)
 * 
 * @param props - Handler dependencies
 * @returns Object with section handlers
 */
export function useSectionHandlers({
  projectId,
  project,
  setProject,
  activeViewId,
  setError,
  newSectionName,
  setNewSectionName,
  setIsAddingSection,
  setShowAddSection,
  editingSectionName,
  setEditingSectionId,
  setEditingSectionName,
  loadProject,
}: UseSectionHandlersProps) {
  /**
   * Handle adding a new section
   */
  const handleAddSection = async () => {
    if (!projectId || !project || !newSectionName.trim()) return
    setIsAddingSection(true)
    try {
      await projectsApi.addSection(projectId, newSectionName.trim())
      await loadProject(projectId)
      setNewSectionName('')
      setShowAddSection(false)
    } catch {
      setError('Ошибка добавления раздела')
    } finally {
      setIsAddingSection(false)
    }
  }

  /**
   * Handle deleting a section
   */
  const handleDeleteSection = async (sectionId: SectionId, sectionName: string) => {
    if (!projectId || !project) return
    if (!confirm(`Удалить раздел "${sectionName}" и все его позиции?`)) return
    try {
      await projectsApi.deleteSection(projectId, sectionId)
      setProject({ ...project, sections: project.sections.filter(s => s.id !== sectionId) })
    } catch {
      setError('Ошибка удаления раздела')
    }
  }

  /**
   * Handle renaming a section
   */
  const handleRenameSectionSave = async (section: EstimateSection) => {
    if (!projectId || !project || !editingSectionName.trim()) return
    try {
      await projectsApi.updateSection(projectId, section.id as SectionId, { name: editingSectionName.trim() })
      setProject({
        ...project,
        sections: project.sections.map(s =>
          s.id === section.id ? { ...s, name: editingSectionName.trim() } : s
        ),
      })
      setEditingSectionId(null)
      setEditingSectionName('')
    } catch {
      setError('Ошибка переименования раздела')
    }
  }

  /**
   * Handle section visibility change
   */
  const handleSectionVisibilityChange = async (sectionId: SectionId, currentVisible: boolean) => {
    if (!projectId || !project || !activeViewId) return
    try {
      const newVisible = !currentVisible
      await projectsApi.updateViewSectionSetting(projectId, activeViewId, sectionId, { visible: newVisible })
      setProject({
        ...project,
        sections: project.sections.map(s =>
          s.id === sectionId
            ? { ...s, viewSettings: { ...s.viewSettings, [activeViewId]: { visible: newVisible } } }
            : s
        ),
      })
    } catch {
      setError('Ошибка обновления')
    }
  }

  return {
    handleAddSection,
    handleDeleteSection,
    handleRenameSectionSave,
    handleSectionVisibilityChange,
  }
}

