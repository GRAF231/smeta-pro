import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { Material, MaterialId } from '../../types'
import { useProject } from '../../hooks/useProject'
import { getProjectIdFromParams } from '../../utils/params'
import { asMaterialId } from '../../types'
import MaterialsPdfGenerator from '../../components/MaterialsPdfGenerator'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/ToastContainer'
import { IconPlus, IconBox } from '../../components/ui/Icons'
import { formatMoney } from '../../utils/format'
import MaterialsTable from './MaterialsTable'
import AddMaterialsModal from './AddMaterialsModal'
import MaterialsHeader from './components/MaterialsHeader'
import MaterialsActions from './components/MaterialsActions'
import { useMaterials } from './hooks/useMaterials'

export default function MaterialsPage() {
  const params = useParams<{ id: string }>()
  const id = getProjectIdFromParams(params)
  const { project, isLoading: isProjectLoading, error: projectError, setError: setProjectError } = useProject(id)
  const { showError } = useToast()

  const {
    materials,
    isLoading: isLoadingMaterials,
    error: materialsError,
    setError: setMaterialsError,
    parseUrls,
    refreshAll,
    refreshOne,
    updateMaterial,
    deleteMaterial,
  } = useMaterials(id)

  // Add URLs modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [urlsInput, setUrlsInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseProgress, setParseProgress] = useState('')

  // Refresh
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshingItemId, setRefreshingItemId] = useState<MaterialId | null>(null)

  // Inline editing
  const [editingId, setEditingId] = useState<MaterialId | null>(null)
  const [editingData, setEditingData] = useState<Partial<Material>>({})

  // PDF generator
  const [showPdfGenerator, setShowPdfGenerator] = useState(false)

  const handleParseUrls = async () => {
    if (!id || !urlsInput.trim()) return

    const urls = urlsInput
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (urls.length === 0) return

    setIsParsing(true)
    setParseProgress(`Парсинг ${urls.length} ссылок...`)
    setMaterialsError('')

    try {
      await parseUrls(urls)
      setUrlsInput('')
      setShowAddModal(false)
      setParseProgress('')
    } catch {
      setParseProgress('')
    } finally {
      setIsParsing(false)
    }
  }

  const handleRefreshAll = async () => {
    if (!id) return
    setIsRefreshing(true)
    setMaterialsError('')
    try {
      await refreshAll()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRefreshOne = async (materialId: MaterialId) => {
    if (!id) return
    setRefreshingItemId(materialId)
    try {
      await refreshOne(materialId)
    } finally {
      setRefreshingItemId(null)
    }
  }

  const startEditing = (material: Material) => {
    setEditingId(asMaterialId(material.id))
    setEditingData({
      name: material.name,
      article: material.article,
      brand: material.brand,
      unit: material.unit,
      price: material.price,
      quantity: material.quantity,
      url: material.url,
      description: material.description,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingData({})
  }

  const saveEditing = async (material: Material) => {
    if (!id) return
    try {
      await updateMaterial(asMaterialId(material.id), editingData)
      setEditingId(null)
      setEditingData({})
    } catch {
      // Error already set in hook
    }
  }

  const handleDelete = async (materialId: MaterialId) => {
    if (!id) return
    if (!confirm('Удалить этот материал?')) return
    try {
      await deleteMaterial(materialId)
    } catch {
      // Error already set in hook
    }
  }

  const grandTotal = materials.reduce((sum, m) => sum + m.total, 0)

  // Show error toast when error changes
  useEffect(() => {
    const combinedError = materialsError || projectError
    if (combinedError) {
      showError(combinedError)
      if (materialsError) setMaterialsError('')
      if (projectError) setProjectError('')
    }
  }, [materialsError, projectError, showError, setMaterialsError, setProjectError])

  if (isProjectLoading || isLoadingMaterials) {
    return <PageSpinner />
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400">{projectError || 'Проект не найден'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <MaterialsHeader projectId={id!} project={project} materialsCount={materials.length} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div></div>
        <MaterialsActions
          materialsCount={materials.length}
          isRefreshing={isRefreshing}
          onPdfGeneratorClick={() => setShowPdfGenerator(true)}
          onRefreshAll={handleRefreshAll}
          onAddMaterialsClick={() => setShowAddModal(true)}
        />
      </div>

      {/* Total */}
      {materials.length > 0 && (
        <div className="card bg-gradient-to-r from-primary-500/20 to-primary-600/10 border-primary-500/30 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Итого за все материалы</p>
            <p className="font-display text-2xl font-bold text-primary-400">{formatMoney(grandTotal)} ₽</p>
          </div>
        </div>
      )}

      {/* Materials Table */}
      {materials.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center">
            <IconBox className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Нет материалов</h2>
          <p className="text-slate-400 mb-6">Добавьте ссылки на товары, и ИИ автоматически заполнит таблицу</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <IconPlus className="w-5 h-5" />
            Добавить материалы
          </button>
        </div>
      ) : (
        <MaterialsTable
          materials={materials}
          editingId={editingId}
          editingData={editingData}
          refreshingItemId={refreshingItemId}
          grandTotal={grandTotal}
          onStartEditing={startEditing}
          onSaveEditing={saveEditing}
          onCancelEditing={cancelEditing}
          onEditingDataChange={setEditingData}
          onRefreshOne={handleRefreshOne}
          onDelete={handleDelete}
        />
      )}

      {/* Add URLs Modal */}
      <AddMaterialsModal
        isOpen={showAddModal}
        urlsInput={urlsInput}
        isParsing={isParsing}
        parseProgress={parseProgress}
        onClose={() => { setShowAddModal(false); setParseProgress('') }}
        onUrlsInputChange={setUrlsInput}
        onParse={handleParseUrls}
      />

      {/* PDF Generator Modal */}
      {showPdfGenerator && (
        <MaterialsPdfGenerator
          projectId={id!}
          materials={materials}
          projectTitle={project.title}
          onClose={() => setShowPdfGenerator(false)}
        />
      )}
    </div>
  )
}

