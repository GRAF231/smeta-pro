import { projectsApi } from '../../../services/api'
import type { ProjectWithEstimate, EstimateItem, ProjectId, ViewId, SectionId, ItemId } from '../../../types'
import { asItemId } from '../../../types'

interface UseItemHandlersProps {
  projectId: ProjectId | undefined
  project: ProjectWithEstimate | null
  setProject: (project: ProjectWithEstimate | null) => void
  activeViewId: ViewId | null
  setError: (error: string) => void
  editingData: { name?: string; unit?: string; quantity?: number; price?: number }
  setEditingItem: (id: ItemId | null) => void
  setEditingData: (data: { name?: string; unit?: string; quantity?: number; price?: number }) => void
  setNewItemSection: (id: SectionId | null) => void
  loadProject: (id: ProjectId) => Promise<void>
}

/**
 * Hook for item-related handlers (add, edit, delete, visibility)
 * 
 * @param props - Handler dependencies
 * @returns Object with item handlers
 */
export function useItemHandlers({
  projectId,
  project,
  setProject,
  activeViewId,
  setError,
  editingData,
  setEditingItem,
  setEditingData,
  setNewItemSection,
  loadProject,
}: UseItemHandlersProps) {
  /**
   * Handle item visibility change
   */
  const handleItemVisibilityChange = async (sectionId: SectionId, item: EstimateItem) => {
    if (!projectId || !project || !activeViewId) return
    try {
      const currentVisible = item.viewSettings[activeViewId]?.visible ?? true
      const res = await projectsApi.updateViewItemSetting(projectId, activeViewId, asItemId(item.id), { visible: !currentVisible })
      setProject({
        ...project,
        sections: project.sections.map(s =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items.map(i =>
                  i.id === item.id ? { ...i, viewSettings: { ...i.viewSettings, [activeViewId]: res.data } } : i
                ),
              }
            : s
        ),
      })
    } catch {
      setError('Ошибка обновления')
    }
  }

  /**
   * Start editing an item
   */
  const startEditing = (item: EstimateItem, itemStatus?: { paidAmount?: number; completedAmount?: number }) => {
    // Prevent editing paid or completed items
    const isPaid = (itemStatus?.paidAmount || 0) > 0
    const isCompleted = (itemStatus?.completedAmount || 0) > 0
    if (isPaid || isCompleted) {
      setError('Нельзя редактировать оплаченные или выполненные работы')
      return
    }
    
    setEditingItem(asItemId(item.id))
    setEditingData({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      price: activeViewId ? (item.viewSettings[activeViewId]?.price ?? 0) : 0,
    })
  }

  /**
   * Save edited item
   */
  const saveEditing = async (sectionId: SectionId, item: EstimateItem) => {
    if (!projectId || !project || !activeViewId) return
    try {
      const newName = editingData.name ?? item.name
      const newUnit = editingData.unit ?? item.unit
      const newQty = editingData.quantity ?? item.quantity
      const newPrice = editingData.price ?? (item.viewSettings[activeViewId]?.price ?? 0)

      await projectsApi.updateItem(projectId, asItemId(item.id), { name: newName, unit: newUnit, quantity: newQty })
      const viewRes = await projectsApi.updateViewItemSetting(projectId, activeViewId, asItemId(item.id), { price: newPrice })

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
            ? {
                ...s,
                items: s.items.map(i =>
                  i.id === item.id
                    ? { ...i, name: newName, unit: newUnit, quantity: newQty, viewSettings: updatedViewSettings }
                    : i
                ),
              }
            : s
        ),
      })
      setEditingItem(null)
      setEditingData({})
    } catch {
      setError('Ошибка обновления')
    }
  }

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingItem(null)
    setEditingData({})
  }

  /**
   * Handle deleting an item
   */
  const handleDeleteItem = async (sectionId: SectionId, itemId: ItemId, itemStatus?: { paidAmount?: number; completedAmount?: number }) => {
    if (!projectId || !project) return
    
    // Prevent deleting paid or completed items
    const isPaid = (itemStatus?.paidAmount || 0) > 0
    const isCompleted = (itemStatus?.completedAmount || 0) > 0
    if (isPaid || isCompleted) {
      setError('Нельзя удалять оплаченные или выполненные работы')
      return
    }
    
    if (!confirm('Удалить эту позицию?')) return
    try {
      await projectsApi.deleteItem(projectId, itemId)
      setProject({
        ...project,
        sections: project.sections.map(s =>
          s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
        ),
      })
    } catch {
      setError('Ошибка удаления')
    }
  }

  /**
   * Handle adding a new item
   */
  const handleAddItem = async (sectionId: SectionId, name: string, unit: string, quantity: number) => {
    if (!projectId || !project) return
    try {
      await projectsApi.addItem(projectId, { sectionId, name, unit, quantity })
      await loadProject(projectId)
      setNewItemSection(null)
    } catch {
      setError('Ошибка добавления')
    }
  }

  return {
    handleItemVisibilityChange,
    startEditing,
    saveEditing,
    cancelEditing,
    handleDeleteItem,
    handleAddItem,
  }
}

