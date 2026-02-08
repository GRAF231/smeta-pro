import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  projectsApi, 
  ProjectWithEstimate, 
  EstimateSection, 
  EstimateItem,
  EstimateVersion,
  EstimateVersionWithSections
} from '../services/api'

export default function EstimatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [project, setProject] = useState<ProjectWithEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<EstimateItem>>({})
  const [newItemSection, setNewItemSection] = useState<string | null>(null)
  
  // Add section state
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [isAddingSection, setIsAddingSection] = useState(false)

  // Edit section name state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')

  // Version control state
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [versions, setVersions] = useState<EstimateVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<EstimateVersionWithSections | null>(null)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)
  const [isRestoringVersion, setIsRestoringVersion] = useState(false)

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

  // === Section handlers ===

  const handleAddSection = async () => {
    if (!id || !project || !newSectionName.trim()) return
    setIsAddingSection(true)
    try {
      const res = await projectsApi.addSection(id, newSectionName.trim())
      setProject({
        ...project,
        sections: [...project.sections, res.data],
      })
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
      setProject({
        ...project,
        sections: project.sections.filter(s => s.id !== sectionId),
      })
    } catch {
      setError('Ошибка удаления раздела')
    }
  }

  const handleRenameSectionSave = async (section: EstimateSection) => {
    if (!id || !project || !editingSectionName.trim()) return
    try {
      await projectsApi.updateSection(id, section.id, {
        name: editingSectionName.trim(),
        showCustomer: section.showCustomer,
        showMaster: section.showMaster,
      })
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

  const handleSectionVisibilityChange = async (section: EstimateSection, field: 'showCustomer' | 'showMaster') => {
    if (!id || !project) return
    try {
      const newValue = !section[field]
      await projectsApi.updateSection(id, section.id, {
        name: section.name,
        showCustomer: field === 'showCustomer' ? newValue : section.showCustomer,
        showMaster: field === 'showMaster' ? newValue : section.showMaster,
      })
      
      setProject({
        ...project,
        sections: project.sections.map(s => 
          s.id === section.id ? { ...s, [field]: newValue } : s
        ),
      })
    } catch {
      setError('Ошибка обновления')
    }
  }

  // === Item handlers ===

  const handleItemVisibilityChange = async (sectionId: string, item: EstimateItem, field: 'showCustomer' | 'showMaster') => {
    if (!id || !project) return
    try {
      const newValue = !item[field]
      await projectsApi.updateItem(id, item.id, {
        ...item,
        [field]: newValue,
      })
      
      setProject({
        ...project,
        sections: project.sections.map(s => 
          s.id === sectionId 
            ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, [field]: newValue } : i) }
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
      customerPrice: item.customerPrice,
      masterPrice: item.masterPrice,
    })
  }

  const cancelEditing = () => {
    setEditingItem(null)
    setEditingData({})
  }

  const saveEditing = async (sectionId: string, item: EstimateItem) => {
    if (!id || !project) return
    try {
      const updatedItem = {
        ...item,
        ...editingData,
        customerTotal: (editingData.quantity || item.quantity) * (editingData.customerPrice || item.customerPrice),
        masterTotal: (editingData.quantity || item.quantity) * (editingData.masterPrice || item.masterPrice),
      }
      
      await projectsApi.updateItem(id, item.id, updatedItem)
      
      setProject({
        ...project,
        sections: project.sections.map(s => 
          s.id === sectionId 
            ? { ...s, items: s.items.map(i => i.id === item.id ? updatedItem : i) }
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
        sections: project.sections.map(s => 
          s.id === sectionId 
            ? { ...s, items: s.items.filter(i => i.id !== itemId) }
            : s
        ),
      })
    } catch {
      setError('Ошибка удаления')
    }
  }

  const handleAddItem = async (sectionId: string, name: string, unit: string, quantity: number, customerPrice: number, masterPrice: number) => {
    if (!id || !project) return
    try {
      const res = await projectsApi.addItem(id, { sectionId, name, unit, quantity, customerPrice, masterPrice })
      setProject({
        ...project,
        sections: project.sections.map(s => 
          s.id === sectionId 
            ? { ...s, items: [...s.items, res.data] }
            : s
        ),
      })
      setNewItemSection(null)
    } catch {
      setError('Ошибка добавления')
    }
  }

  // === Version handlers ===

  const loadVersions = async () => {
    if (!id) return
    setIsLoadingVersions(true)
    try {
      const res = await projectsApi.getVersions(id)
      setVersions(res.data)
    } catch {
      setError('Ошибка загрузки версий')
    } finally {
      setIsLoadingVersions(false)
    }
  }

  const handleOpenVersionModal = async () => {
    setShowVersionModal(true)
    setSelectedVersion(null)
    await loadVersions()
  }

  const handleCreateVersion = async () => {
    if (!id) return
    setIsCreatingVersion(true)
    try {
      await projectsApi.createVersion(id, newVersionName || undefined)
      setNewVersionName('')
      await loadVersions()
    } catch {
      setError('Ошибка создания версии')
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const handleSelectVersion = async (versionId: string) => {
    if (!id) return
    try {
      const res = await projectsApi.getVersion(id, versionId)
      setSelectedVersion(res.data)
    } catch {
      setError('Ошибка загрузки версии')
    }
  }

  const handleRestoreVersion = async () => {
    if (!id || !selectedVersion) return
    if (!confirm(`Восстановить смету из версии ${selectedVersion.versionNumber}${selectedVersion.name ? ` "${selectedVersion.name}"` : ''}? Текущие данные будут заменены.`)) return
    
    setIsRestoringVersion(true)
    try {
      await projectsApi.restoreVersion(id, selectedVersion.id)
      await loadProject(id)
      setShowVersionModal(false)
      setSelectedVersion(null)
    } catch {
      setError('Ошибка восстановления версии')
    } finally {
      setIsRestoringVersion(false)
    }
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('ru-RU').format(num)

  const calculateTotals = () => {
    let customerTotal = 0
    let masterTotal = 0
    
    project?.sections.forEach(section => {
      if (section.showCustomer) {
        section.items.forEach(item => {
          if (item.showCustomer) customerTotal += item.customerTotal
        })
      }
      if (section.showMaster) {
        section.items.forEach(item => {
          if (item.showMaster) masterTotal += item.masterTotal
        })
      }
    })
    
    return { customerTotal, masterTotal }
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

  const totals = calculateTotals()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={() => navigate(`/projects/${id}/edit`)} className="text-slate-400 hover:text-white mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к проекту
          </button>
          <h1 className="font-display text-2xl font-bold text-white">Смета: {project.title}</h1>
          {project.lastSyncedAt && (
            <p className="text-sm text-slate-500 mt-1">
              Синхронизировано: {new Date(project.lastSyncedAt).toLocaleString('ru-RU')}
            </p>
          )}
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate(`/projects/${id}/act`)}
            disabled={project.sections.length === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Создать акт
          </button>
          <button
            onClick={handleOpenVersionModal}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            История версий
          </button>
          {project.googleSheetId && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isSyncing ? 'Синхронизация...' : 'Обновить из таблицы'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-red-300">✕</button>
        </div>
      )}

      {/* Totals summary */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="card bg-gradient-to-r from-primary-500/20 to-primary-600/10 border-primary-500/30">
          <p className="text-sm text-slate-400 mb-1">Итого для заказчика</p>
          <p className="font-display text-2xl font-bold text-primary-400">{formatNumber(totals.customerTotal)} ₽</p>
        </div>
        <div className="card bg-gradient-to-r from-accent-500/20 to-accent-600/10 border-accent-500/30">
          <p className="text-sm text-slate-400 mb-1">Итого для мастеров</p>
          <p className="font-display text-2xl font-bold text-accent-400">{formatNumber(totals.masterTotal)} ₽</p>
        </div>
      </div>

      {/* Legend */}
      <div className="card mb-6 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">З</div>
          <span className="text-slate-400">Видно заказчику</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent-500/20 flex items-center justify-center text-accent-400 text-xs font-bold">М</div>
          <span className="text-slate-400">Видно мастерам</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-slate-500">Кликните на строку для редактирования</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {project.sections.map(section => (
          <div key={section.id} className="card overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between -mx-3 sm:-mx-6 -mt-3 sm:-mt-6 mb-3 sm:mb-4 px-3 sm:px-6 py-3 sm:py-4 bg-slate-700/30 border-b border-slate-700/50">
              {editingSectionId === section.id ? (
                <div className="flex items-center gap-2 flex-1 mr-3">
                  <input
                    type="text"
                    value={editingSectionName}
                    onChange={(e) => setEditingSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSectionSave(section)
                      if (e.key === 'Escape') { setEditingSectionId(null); setEditingSectionName('') }
                    }}
                    className="input-field py-1 px-2 text-lg font-semibold flex-1"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRenameSectionSave(section)}
                    className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { setEditingSectionId(null); setEditingSectionName('') }}
                    className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <h2
                  className="font-display font-semibold text-lg text-white cursor-pointer hover:text-primary-300 transition-colors"
                  onClick={() => { setEditingSectionId(section.id); setEditingSectionName(section.name) }}
                  title="Нажмите для переименования"
                >
                  {section.name}
                </h2>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSectionVisibilityChange(section, 'showCustomer')}
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${
                    section.showCustomer 
                      ? 'bg-primary-500/30 text-primary-400 border border-primary-500/50' 
                      : 'bg-slate-700/50 text-slate-500 border border-slate-600/50'
                  }`}
                  title="Показать заказчику"
                >
                  З
                </button>
                <button
                  onClick={() => handleSectionVisibilityChange(section, 'showMaster')}
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${
                    section.showMaster 
                      ? 'bg-accent-500/30 text-accent-400 border border-accent-500/50' 
                      : 'bg-slate-700/50 text-slate-500 border border-slate-600/50'
                  }`}
                  title="Показать мастерам"
                >
                  М
                </button>
                <button
                  onClick={() => handleDeleteSection(section.id, section.name)}
                  className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Удалить раздел"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-x-auto -mx-3 sm:-mx-6">
              <table className="w-full min-w-[900px] text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700/50">
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-8 sm:w-10">З</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-8 sm:w-10">М</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2">Наименование</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-14 sm:w-20">Ед.</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-16 sm:w-24 text-right">Кол-во</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-20 sm:w-28 text-right">Цена З</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-24 sm:w-32 text-right">Сумма З</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-20 sm:w-28 text-right">Цена М</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-24 sm:w-32 text-right">Сумма М</th>
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 w-16 sm:w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map(item => (
                    editingItem === item.id ? (
                      <tr key={item.id} className="bg-slate-700/40 border-b border-slate-600/50">
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={item.showCustomer} onChange={() => handleItemVisibilityChange(section.id, item, 'showCustomer')} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={item.showMaster} onChange={() => handleItemVisibilityChange(section.id, item, 'showMaster')} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-accent-500" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="text" value={editingData.name ?? item.name} onChange={(e) => setEditingData({ ...editingData, name: e.target.value })} className="input-field py-1 px-2 text-sm w-full" autoFocus />
                        </td>
                        <td className="px-3 py-2">
                          <input type="text" value={editingData.unit ?? item.unit} onChange={(e) => setEditingData({ ...editingData, unit: e.target.value })} className="input-field py-1 px-2 text-sm w-full" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="0.1" value={editingData.quantity ?? item.quantity} onChange={(e) => setEditingData({ ...editingData, quantity: parseFloat(e.target.value) || 0 })} className="input-field py-1 px-2 text-sm w-full text-right" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={editingData.customerPrice ?? item.customerPrice} onChange={(e) => setEditingData({ ...editingData, customerPrice: parseFloat(e.target.value) || 0 })} className="input-field py-1 px-2 text-sm w-full text-right" />
                        </td>
                        <td className="px-3 py-2 text-right text-primary-300 font-medium">
                          {formatNumber((editingData.quantity ?? item.quantity) * (editingData.customerPrice ?? item.customerPrice))}
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={editingData.masterPrice ?? item.masterPrice} onChange={(e) => setEditingData({ ...editingData, masterPrice: parseFloat(e.target.value) || 0 })} className="input-field py-1 px-2 text-sm w-full text-right" />
                        </td>
                        <td className="px-3 py-2 text-right text-accent-300 font-medium">
                          {formatNumber((editingData.quantity ?? item.quantity) * (editingData.masterPrice ?? item.masterPrice))}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => saveEditing(section.id, item)} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Сохранить">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button onClick={cancelEditing} className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded" title="Отмена">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors" onClick={() => startEditing(item)}>
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={item.showCustomer} onChange={() => handleItemVisibilityChange(section.id, item, 'showCustomer')} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500" />
                        </td>
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={item.showMaster} onChange={() => handleItemVisibilityChange(section.id, item, 'showMaster')} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-accent-500 focus:ring-accent-500" />
                        </td>
                        <td className="px-3 py-2 text-slate-200">{item.name}</td>
                        <td className="px-3 py-2 text-slate-400">{item.unit}</td>
                        <td className="px-3 py-2 text-right text-slate-300">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-primary-400">{formatNumber(item.customerPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium text-primary-300">{formatNumber(item.customerTotal)}</td>
                        <td className="px-3 py-2 text-right text-accent-400">{formatNumber(item.masterPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium text-accent-300">{formatNumber(item.masterTotal)}</td>
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleDeleteItem(section.id, item.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Удалить">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                  
                  {/* Add new item row */}
                  {newItemSection === section.id ? (
                    <NewItemRow
                      onSave={(name, unit, qty, cp, mp) => handleAddItem(section.id, name, unit, qty, cp, mp)}
                      onCancel={() => setNewItemSection(null)}
                    />
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-3 py-2">
                        <button onClick={() => setNewItemSection(section.id)} className="text-sm text-slate-500 hover:text-primary-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Добавить позицию
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
              <button
                onClick={handleAddSection}
                disabled={isAddingSection || !newSectionName.trim()}
                className="btn-primary whitespace-nowrap"
              >
                {isAddingSection ? 'Добавление...' : 'Добавить'}
              </button>
              <button
                onClick={() => { setShowAddSection(false); setNewSectionName('') }}
                className="btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSection(true)}
            className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-primary-400 hover:border-primary-500/50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить раздел
          </button>
        )}
      </div>

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="font-display text-xl font-bold text-white">
                {selectedVersion ? `Версия ${selectedVersion.versionNumber}` : 'История версий'}
              </h2>
              <button 
                onClick={() => { setShowVersionModal(false); setSelectedVersion(null); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedVersion ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setSelectedVersion(null)} className="text-slate-400 hover:text-white flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Назад к списку
                    </button>
                    <button onClick={handleRestoreVersion} disabled={isRestoringVersion} className="btn-primary flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      {isRestoringVersion ? 'Восстановление...' : 'Восстановить эту версию'}
                    </button>
                  </div>

                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-slate-400">Название:</span><span className="ml-2 text-white">{selectedVersion.name || '—'}</span></div>
                      <div><span className="text-slate-400">Создана:</span><span className="ml-2 text-white">{new Date(selectedVersion.createdAt).toLocaleString('ru-RU')}</span></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedVersion.sections.map(section => (
                      <div key={section.id} className="bg-slate-700/20 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-slate-700/30 border-b border-slate-700/50"><h3 className="font-semibold text-white">{section.name}</h3></div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-slate-400 border-b border-slate-700/30">
                                <th className="px-4 py-2">Наименование</th>
                                <th className="px-4 py-2 w-16">Ед.</th>
                                <th className="px-4 py-2 w-20 text-right">Кол-во</th>
                                <th className="px-4 py-2 w-28 text-right">Цена З</th>
                                <th className="px-4 py-2 w-28 text-right">Цена М</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.items.map(item => (
                                <tr key={item.id} className="border-b border-slate-700/20">
                                  <td className="px-4 py-2 text-slate-200">{item.name}</td>
                                  <td className="px-4 py-2 text-slate-400">{item.unit}</td>
                                  <td className="px-4 py-2 text-right text-slate-300">{item.quantity}</td>
                                  <td className="px-4 py-2 text-right text-primary-400">{formatNumber(item.customerPrice)}</td>
                                  <td className="px-4 py-2 text-right text-accent-400">{formatNumber(item.masterPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-3">Сохранить текущую версию</h3>
                    <div className="flex gap-3">
                      <input type="text" value={newVersionName} onChange={(e) => setNewVersionName(e.target.value)} placeholder="Название версии (необязательно)" className="input-field flex-1" />
                      <button onClick={handleCreateVersion} disabled={isCreatingVersion} className="btn-primary whitespace-nowrap">
                        {isCreatingVersion ? 'Сохранение...' : 'Сохранить версию'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-3">Сохранённые версии</h3>
                    {isLoadingVersions ? (
                      <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
                    ) : versions.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p>Версий пока нет</p>
                        <p className="text-sm mt-1">Сохраните первую версию, чтобы иметь возможность откатиться к ней позже</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {versions.map(version => (
                          <button key={version.id} onClick={() => handleSelectVersion(version.id)} className="w-full flex items-center justify-between p-4 bg-slate-700/20 hover:bg-slate-700/40 rounded-xl transition-colors text-left">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">Версия {version.versionNumber}</span>
                                {version.name && <span className="text-primary-400">"{version.name}"</span>}
                              </div>
                              <p className="text-sm text-slate-400 mt-1">{new Date(version.createdAt).toLocaleString('ru-RU')}</p>
                            </div>
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component for adding new item
function NewItemRow({ onSave, onCancel }: { onSave: (name: string, unit: string, qty: number, cp: number, mp: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [customerPrice, setCustomerPrice] = useState(0)
  const [masterPrice, setMasterPrice] = useState(0)

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave(name, unit, quantity, customerPrice, masterPrice)
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('ru-RU').format(num)

  return (
    <tr className="bg-slate-700/30">
      <td className="px-3 py-2" colSpan={2}></td>
      <td className="px-3 py-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название работы" className="input-field py-1 px-2 text-sm w-full" autoFocus />
      </td>
      <td className="px-3 py-2">
        <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="шт." className="input-field py-1 px-2 text-sm w-full" />
      </td>
      <td className="px-3 py-2">
        <input type="number" step="0.1" value={quantity || ''} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} placeholder="0" className="input-field py-1 px-2 text-sm w-full text-right" />
      </td>
      <td className="px-3 py-2">
        <input type="number" value={customerPrice || ''} onChange={(e) => setCustomerPrice(parseFloat(e.target.value) || 0)} placeholder="0" className="input-field py-1 px-2 text-sm w-full text-right" />
      </td>
      <td className="px-3 py-2 text-right text-primary-300">{formatNumber(quantity * customerPrice)}</td>
      <td className="px-3 py-2">
        <input type="number" value={masterPrice || ''} onChange={(e) => setMasterPrice(parseFloat(e.target.value) || 0)} placeholder="0" className="input-field py-1 px-2 text-sm w-full text-right" />
      </td>
      <td className="px-3 py-2 text-right text-accent-300">{formatNumber(quantity * masterPrice)}</td>
      <td className="px-3 py-2">
        <div className="flex gap-1 justify-end">
          <button onClick={handleSubmit} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Добавить">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </button>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded" title="Отмена">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

