import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/ToastContainer'
import { IconPlus } from '../../components/ui/Icons'
import ViewTabs from './ViewTabs'
import SectionCard from './SectionCard'
import VersionModal from './VersionModal'
import EstimateHeader from './components/EstimateHeader'
import EstimateTotals from './components/EstimateTotals'
import { useEstimatePageState } from './hooks/useEstimatePageState'
import { useEstimateHandlers } from './hooks/useEstimateHandlers'
import { calculateTotals } from './utils/calculations'
import { getProjectIdFromParams } from '../../utils/params'

/**
 * Estimate page component
 * 
 * Main page for editing estimates with sections and items.
 * Features:
 * - Multiple views (representations) of the same estimate
 * - Sections and items management
 * - Version control
 * - Price editing per view
 * - Visibility controls
 * 
 * @example
 * Used as a route in App.tsx:
 * ```tsx
 * <Route path="projects/:id/estimate" element={<EstimatePage />} />
 * ```
 */
export default function EstimatePage() {
  const params = useParams<{ id: string }>()
  const id = getProjectIdFromParams(params)
  const { showError } = useToast()

  const {
    project,
    setProject,
    isLoading,
    isSyncing,
    setIsSyncing,
    error,
    setError,
    editingItem,
    setEditingItem,
    editingData,
    setEditingData,
    newItemSection,
    setNewItemSection,
    activeViewId,
    setActiveViewId,
    showAddSection,
    setShowAddSection,
    newSectionName,
    setNewSectionName,
    isAddingSection,
    setIsAddingSection,
    editingSectionId,
    setEditingSectionId,
    editingSectionName,
    setEditingSectionName,
    showVersionModal,
    setShowVersionModal,
    loadProject,
  } = useEstimatePageState(id)

  const {
    handleSync,
    handleAddView,
    handleDuplicateView,
    handleDeleteView,
    handleAddSection,
    handleDeleteSection,
    handleRenameSectionSave,
    handleSectionVisibilityChange,
    handleItemVisibilityChange,
    startEditing,
    saveEditing,
    cancelEditing,
    handleDeleteItem,
    handleAddItem,
  } = useEstimateHandlers({
    projectId: id,
    project,
    setProject,
    activeViewId,
    setActiveViewId,
    setError,
    editingData,
    setEditingItem,
    setEditingData,
    newSectionName,
    setNewSectionName,
    setIsAddingSection,
    setShowAddSection,
    editingSectionName,
    setEditingSectionId,
    setEditingSectionName,
    setNewItemSection,
    setIsSyncing,
    loadProject,
  })

  const activeView = project?.views.find(v => v.id === activeViewId) || null
  const totals = calculateTotals(project)

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EstimateHeader
        projectId={id!}
        project={project}
        isSyncing={isSyncing}
        onSync={handleSync}
        onVersionsClick={() => setShowVersionModal(true)}
      />

      <ViewTabs
        views={project.views}
        activeViewId={activeViewId}
        totals={totals}
        onSelectView={setActiveViewId}
        onAddView={handleAddView}
        onDuplicateView={handleDuplicateView}
        onDeleteView={handleDeleteView}
      />

      <EstimateTotals activeView={activeView} total={totals[activeViewId || ''] || 0} />

      {/* Legend */}
      <div className="card mb-6 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked readOnly className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500" />
          <span className="text-slate-400">Видно в «{activeView?.name || '...'}»</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-slate-500">Кликните на строку для редактирования</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {project.sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            activeViewId={activeViewId}
            activeView={activeView}
            editingItem={editingItem}
            editingData={editingData}
            newItemSection={newItemSection}
            editingSectionId={editingSectionId}
            editingSectionName={editingSectionName}
            onEditingSectionIdChange={setEditingSectionId}
            onEditingSectionNameChange={setEditingSectionName}
            onRenameSectionSave={handleRenameSectionSave}
            onSectionVisibilityChange={handleSectionVisibilityChange}
            onDeleteSection={handleDeleteSection}
            onItemVisibilityChange={handleItemVisibilityChange}
            onStartEditing={startEditing}
            onCancelEditing={cancelEditing}
            onSaveEditing={saveEditing}
            onEditingDataChange={setEditingData}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onNewItemSectionChange={setNewItemSection}
          />
        ))}

        {/* Add Section Button */}
        {showAddSection ? (
          <div className="card">
            <h3 className="font-semibold text-white mb-3">Новый раздел</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection()
                  if (e.key === 'Escape') { setShowAddSection(false); setNewSectionName('') }
                }}
                placeholder="Название раздела"
                className="input-field flex-1"
                autoFocus
              />
              <button onClick={handleAddSection} disabled={isAddingSection || !newSectionName.trim()} className="btn-primary whitespace-nowrap">
                {isAddingSection ? 'Добавление...' : 'Добавить'}
              </button>
              <button onClick={() => { setShowAddSection(false); setNewSectionName('') }} className="btn-secondary">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSection(true)}
            className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-primary-400 hover:border-primary-500/50 transition-all flex items-center justify-center gap-2"
          >
            <IconPlus className="w-5 h-5" />
            Добавить раздел
          </button>
        )}
      </div>

      {/* Version Modal */}
      {showVersionModal && id && (
        <VersionModal
          projectId={id}
          onClose={() => setShowVersionModal(false)}
          onRestored={async () => {
            setActiveViewId(null)
            await loadProject(id)
          }}
          onError={setError}
        />
      )}
    </div>
  )
}

