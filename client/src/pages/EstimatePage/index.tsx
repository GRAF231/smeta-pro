import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi } from '../../services/api'
import type { ProjectWithEstimate, EstimateSection, EstimateItem } from '../../types'
import { formatNumber } from '../../utils/format'
import { PageSpinner } from '../../components/ui/Spinner'
import ErrorAlert from '../../components/ui/ErrorAlert'
import BackButton from '../../components/ui/BackButton'
import { IconDocument, IconClock, IconSync, IconPlus } from '../../components/ui/Icons'
import ViewTabs from './ViewTabs'
import SectionCard from './SectionCard'
import VersionModal from './VersionModal'

export default function EstimatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectWithEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<{ name?: string; unit?: string; quantity?: number; price?: number }>({})
  const [newItemSection, setNewItemSection] = useState<string | null>(null)

  // Active view tab
  const [activeViewId, setActiveViewId] = useState<string | null>(null)

  // Add section state
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [isAddingSection, setIsAddingSection] = useState(false)

  // Edit section name state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')

  // Version modal
  const [showVersionModal, setShowVersionModal] = useState(false)

  useEffect(() => {
    if (id) loadProject(id)
  }, [id])

  const loadProject = async (projectId: string) => {
    try {
      const res = await projectsApi.getOne(projectId)
      setProject(res.data)
      if (!activeViewId && res.data.views.length > 0) {
        setActiveViewId(res.data.views[0].id)
      }
    } catch {
      setError('Ошибка загрузки проекта')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    if (!id) return
    setIsSyncing(true)
    try {
      await projectsApi.sync(id)
      await loadProject(id)
    } catch {
      setError('Ошибка синхронизации')
    } finally {
      setIsSyncing(false)
    }
  }

  const activeView = project?.views.find(v => v.id === activeViewId) || null

  // === View handlers ===

  const handleAddView = async (name: string) => {
    if (!id || !project) return
    try {
      const res = await projectsApi.createView(id, name)
      setProject({ ...project, views: [...project.views, res.data] })
      setActiveViewId(res.data.id)
      await loadProject(id)
    } catch {
      setError('Ошибка создания представления')
    }
  }

  const handleDuplicateView = async (viewId: string) => {
    if (!id || !project) return
    try {
      const res = await projectsApi.duplicateView(id, viewId)
      setProject({ ...project, views: [...project.views, res.data] })
      setActiveViewId(res.data.id)
      await loadProject(id)
    } catch {
      setError('Ошибка дублирования представления')
    }
  }

  const handleDeleteView = async (viewId: string) => {
    if (!id || !project) return
    const view = project.views.find(v => v.id === viewId)
    if (!view) return
    if (project.views.length <= 1) { setError('Нельзя удалить последнее представление'); return }
    if (!confirm(`Удалить представление "${view.name}"?`)) return
    try {
      await projectsApi.deleteView(id, viewId)
      const remaining = project.views.filter(v => v.id !== viewId)
      setProject({ ...project, views: remaining })
      if (activeViewId === viewId) setActiveViewId(remaining[0]?.id || null)
    } catch {
      setError('Ошибка удаления представления')
    }
  }

  // === Section handlers ===

  const handleAddSection = async () => {
    if (!id || !project || !newSectionName.trim()) return
    setIsAddingSection(true)
    try {
      await projectsApi.addSection(id, newSectionName.trim())
      await loadProject(id)
      setNewSectionName('')
      setShowAddSection(false)
    } catch {
      setError('Ошибка добавления раздела')
    } finally {
      setIsAddingSection(false)
    }
  }

  const handleDeleteSection = async (sectionId: string, sectionName: string) => {
    if (!id || !project) return
    if (!confirm(`Удалить раздел "${sectionName}" и все его позиции?`)) return
    try {
      await projectsApi.deleteSection(id, sectionId)
      setProject({ ...project, sections: project.sections.filter(s => s.id !== sectionId) })
    } catch {
      setError('Ошибка удаления раздела')
    }
  }

  const handleRenameSectionSave = async (section: EstimateSection) => {
    if (!id || !project || !editingSectionName.trim()) return
    try {
      await projectsApi.updateSection(id, section.id, { name: editingSectionName.trim() })
      setProject({
        ...project,
        sections: project.sections.map(s => s.id === section.id ? { ...s, name: editingSectionName.trim() } : s),
      })
      setEditingSectionId(null)
      setEditingSectionName('')
    } catch {
      setError('Ошибка переименования раздела')
    }
  }

  const handleSectionVisibilityChange = async (sectionId: string, currentVisible: boolean) => {
    if (!id || !project || !activeViewId) return
    try {
      const newVisible = !currentVisible
      await projectsApi.updateViewSectionSetting(id, activeViewId, sectionId, { visible: newVisible })
      setProject({
        ...project,
        sections: project.sections.map(s =>
          s.id === sectionId ? { ...s, viewSettings: { ...s.viewSettings, [activeViewId]: { visible: newVisible } } } : s
        ),
      })
    } catch {
      setError('Ошибка обновления')
    }
  }

  // === Item handlers ===

  const handleItemVisibilityChange = async (sectionId: string, item: EstimateItem) => {
    if (!id || !project || !activeViewId) return
    try {
      const currentVisible = item.viewSettings[activeViewId]?.visible ?? true
      const res = await projectsApi.updateViewItemSetting(id, activeViewId, item.id, { visible: !currentVisible })
      setProject({
        ...project,
        sections: project.sections.map(s =>
          s.id === sectionId
            ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, viewSettings: { ...i.viewSettings, [activeViewId]: res.data } } : i) }
            : s
        ),
      })
    } catch {
      setError('Ошибка обновления')
    }
  }

  const startEditing = (item: EstimateItem) => {
    setEditingItem(item.id)
    setEditingData({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      price: activeViewId ? (item.viewSettings[activeViewId]?.price ?? 0) : 0,
    })
  }

  const saveEditing = async (sectionId: string, item: EstimateItem) => {
    if (!id || !project || !activeViewId) return
    try {
      const newName = editingData.name ?? item.name
      const newUnit = editingData.unit ?? item.unit
      const newQty = editingData.quantity ?? item.quantity
      const newPrice = editingData.price ?? (item.viewSettings[activeViewId]?.price ?? 0)

      await projectsApi.updateItem(id, item.id, { name: newName, unit: newUnit, quantity: newQty })
      const viewRes = await projectsApi.updateViewItemSetting(id, activeViewId, item.id, { price: newPrice })

      const updatedViewSettings = { ...item.viewSettings, [activeViewId]: viewRes.data }
      if (newQty !== item.quantity) {
        for (const viewId of Object.keys(item.viewSettings)) {
          if (viewId !== activeViewId) {
            const vs = item.viewSettings[viewId]
            updatedViewSettings[viewId] = { ...vs, total: newQty * vs.price }
          }
        }
      }

      setProject({
        ...project,
        sections: project.sections.map(s =>
          s.id === sectionId
            ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, name: newName, unit: newUnit, quantity: newQty, viewSettings: updatedViewSettings } : i) }
            : s
        ),
      })
      setEditingItem(null)
      setEditingData({})
    } catch {
      setError('Ошибка обновления')
    }
  }

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    if (!id || !project) return
    if (!confirm('Удалить эту позицию?')) return
    try {
      await projectsApi.deleteItem(id, itemId)
      setProject({
        ...project,
        sections: project.sections.map(s => s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s),
      })
    } catch {
      setError('Ошибка удаления')
    }
  }

  const handleAddItem = async (sectionId: string, name: string, unit: string, quantity: number) => {
    if (!id || !project) return
    try {
      await projectsApi.addItem(id, { sectionId, name, unit, quantity })
      await loadProject(id)
      setNewItemSection(null)
    } catch {
      setError('Ошибка добавления')
    }
  }

  // === Totals ===

  const calculateTotals = () => {
    const totals: Record<string, number> = {}
    if (!project) return totals
    for (const view of project.views) {
      let viewTotal = 0
      project.sections.forEach(section => {
        const sectionVisible = section.viewSettings[view.id]?.visible ?? true
        if (sectionVisible) {
          section.items.forEach(item => {
            const itemSettings = item.viewSettings[view.id]
            if (itemSettings?.visible) viewTotal += itemSettings.total
          })
        }
      })
      totals[view.id] = viewTotal
    }
    return totals
  }

  // === Render ===

  if (isLoading) return <PageSpinner />

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400">{error || 'Проект не найден'}</p>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <BackButton to={`/projects/${id}/edit`} label="Назад к проекту" />
          <h1 className="font-display text-2xl font-bold text-white">{project.title}</h1>
          {project.lastSyncedAt && (
            <p className="text-sm text-slate-500 mt-1">
              Синхронизировано: {new Date(project.lastSyncedAt).toLocaleString('ru-RU')}
            </p>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate(`/projects/${id}/acts`)} className="btn-secondary flex items-center gap-2">
            <IconDocument className="w-5 h-5" />
            Акты
          </button>
          <button onClick={() => setShowVersionModal(true)} className="btn-secondary flex items-center gap-2">
            <IconClock className="w-5 h-5" />
            Версии
          </button>
          {project.googleSheetId && (
            <button onClick={handleSync} disabled={isSyncing} className="btn-secondary flex items-center gap-2">
              <IconSync className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Синхронизация...' : 'Обновить из таблицы'}
            </button>
          )}
        </div>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {/* View Tabs */}
      <ViewTabs
        views={project.views}
        activeViewId={activeViewId}
        totals={totals}
        onSelectView={setActiveViewId}
        onAddView={handleAddView}
        onDuplicateView={handleDuplicateView}
        onDeleteView={handleDeleteView}
      />

      {/* Totals for active view */}
      {activeView && (
        <div className="card bg-gradient-to-r from-primary-500/20 to-primary-600/10 border-primary-500/30 mb-8">
          <p className="text-sm text-slate-400 mb-1">Итого: {activeView.name}</p>
          <p className="font-display text-2xl font-bold text-primary-400">{formatNumber(totals[activeView.id] || 0)} ₽</p>
        </div>
      )}

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
            onCancelEditing={() => { setEditingItem(null); setEditingData({}) }}
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

