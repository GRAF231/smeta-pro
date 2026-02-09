import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { materialsApi, Material, projectsApi, Project } from '../services/api'
import MaterialsPdfGenerator from '../components/MaterialsPdfGenerator'
import { PageSpinner } from '../components/ui/Spinner'
import ErrorAlert from '../components/ui/ErrorAlert'
import Spinner from '../components/ui/Spinner'
import BackButton from '../components/ui/BackButton'
import Modal from '../components/ui/Modal'
import { formatMoney } from '../utils/format'

export default function MaterialsPage() {
  const { id } = useParams<{ id: string }>()

  const [project, setProject] = useState<Project | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Add URLs modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [urlsInput, setUrlsInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseProgress, setParseProgress] = useState('')

  // Refresh
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshingItemId, setRefreshingItemId] = useState<string | null>(null)

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<Material>>({})

  // PDF generator
  const [showPdfGenerator, setShowPdfGenerator] = useState(false)

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (projectId: string) => {
    try {
      const [projRes, matRes] = await Promise.all([
        projectsApi.getOne(projectId),
        materialsApi.getAll(projectId),
      ])
      setProject(projRes.data)
      setMaterials(matRes.data)
    } catch {
      setError('Ошибка загрузки данных')
    } finally {
      setIsLoading(false)
    }
  }

  const handleParseUrls = async () => {
    if (!id || !urlsInput.trim()) return

    const urls = urlsInput
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (urls.length === 0) return

    setIsParsing(true)
    setParseProgress(`Парсинг ${urls.length} ссылок...`)
    setError('')

    try {
      const res = await materialsApi.parse(id, urls)
      setMaterials(prev => [...prev, ...res.data])
      setUrlsInput('')
      setShowAddModal(false)
      setParseProgress('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка парсинга ссылок')
      setParseProgress('')
    } finally {
      setIsParsing(false)
    }
  }

  const handleRefreshAll = async () => {
    if (!id) return
    setIsRefreshing(true)
    setError('')
    try {
      const res = await materialsApi.refreshAll(id)
      setMaterials(res.data.materials)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка актуализации')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRefreshOne = async (materialId: string) => {
    if (!id) return
    setRefreshingItemId(materialId)
    try {
      const res = await materialsApi.refreshOne(id, materialId)
      setMaterials(prev => prev.map(m => m.id === materialId ? res.data : m))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления')
    } finally {
      setRefreshingItemId(null)
    }
  }

  const startEditing = (material: Material) => {
    setEditingId(material.id)
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
      const res = await materialsApi.update(id, material.id, editingData)
      setMaterials(prev => prev.map(m => m.id === material.id ? res.data : m))
      setEditingId(null)
      setEditingData({})
    } catch {
      setError('Ошибка сохранения')
    }
  }

  const handleDelete = async (materialId: string) => {
    if (!id) return
    if (!confirm('Удалить этот материал?')) return
    try {
      await materialsApi.delete(id, materialId)
      setMaterials(prev => prev.filter(m => m.id !== materialId))
    } catch {
      setError('Ошибка удаления')
    }
  }

  const grandTotal = materials.reduce((sum, m) => sum + m.total, 0)

  if (isLoading) {
    return <PageSpinner />
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400">{error || 'Проект не найден'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <BackButton to={`/projects/${id}/edit`} label="Назад к проекту" />
          <h1 className="font-display text-2xl font-bold text-white">
            Материалы: {project.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {materials.length} позиций
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowPdfGenerator(true)}
            disabled={materials.length === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Создать КП (PDF)
          </button>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing || materials.length === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Обновление...' : 'Актуализировать цены'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить материалы
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

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
            <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Нет материалов</h2>
          <p className="text-slate-400 mb-6">Добавьте ссылки на товары, и ИИ автоматически заполнит таблицу</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить материалы
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:-mx-6">
            <table className="w-full min-w-[1100px] text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700/50">
                  <th className="px-2 sm:px-3 py-2 w-8">#</th>
                  <th className="px-2 sm:px-3 py-2">Наименование</th>
                  <th className="px-2 sm:px-3 py-2 w-24">Артикул</th>
                  <th className="px-2 sm:px-3 py-2 w-24">Бренд</th>
                  <th className="px-2 sm:px-3 py-2 w-14">Ед.</th>
                  <th className="px-2 sm:px-3 py-2 w-24 text-right">Цена</th>
                  <th className="px-2 sm:px-3 py-2 w-16 text-right">Кол-во</th>
                  <th className="px-2 sm:px-3 py-2 w-28 text-right">Сумма</th>
                  <th className="px-2 sm:px-3 py-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material, index) =>
                  editingId === material.id ? (
                    // Editing row
                    <tr key={material.id} className="bg-slate-700/40 border-b border-slate-600/50">
                      <td className="px-2 sm:px-3 py-2 text-slate-500">{index + 1}</td>
                      <td className="px-2 sm:px-3 py-2">
                        <input
                          type="text"
                          value={editingData.name ?? material.name}
                          onChange={e => setEditingData({ ...editingData, name: e.target.value })}
                          className="input-field py-1 px-2 text-sm w-full"
                          autoFocus
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <input
                          type="text"
                          value={editingData.article ?? material.article}
                          onChange={e => setEditingData({ ...editingData, article: e.target.value })}
                          className="input-field py-1 px-2 text-sm w-full"
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <input
                          type="text"
                          value={editingData.brand ?? material.brand}
                          onChange={e => setEditingData({ ...editingData, brand: e.target.value })}
                          className="input-field py-1 px-2 text-sm w-full"
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <input
                          type="text"
                          value={editingData.unit ?? material.unit}
                          onChange={e => setEditingData({ ...editingData, unit: e.target.value })}
                          className="input-field py-1 px-2 text-sm w-full"
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editingData.price ?? material.price}
                          onChange={e => setEditingData({ ...editingData, price: parseFloat(e.target.value) || 0 })}
                          className="input-field py-1 px-2 text-sm w-full text-right"
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          value={editingData.quantity ?? material.quantity}
                          onChange={e => setEditingData({ ...editingData, quantity: parseFloat(e.target.value) || 0 })}
                          className="input-field py-1 px-2 text-sm w-full text-right"
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-right text-primary-300 font-medium">
                        {formatMoney((editingData.price ?? material.price) * (editingData.quantity ?? material.quantity))}
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => saveEditing(material)}
                            className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                            title="Сохранить"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1.5 text-slate-400 hover:bg-slate-600/50 rounded"
                            title="Отмена"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Display row
                    <tr
                      key={material.id}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors group"
                      onClick={() => startEditing(material)}
                    >
                      <td className="px-2 sm:px-3 py-2 text-slate-500">{index + 1}</td>
                      <td className="px-2 sm:px-3 py-2">
                        <div className="text-slate-200">{material.name}</div>
                        {material.description && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{material.description}</div>
                        )}
                        {material.url && (
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-500 hover:text-primary-400 mt-0.5 block truncate max-w-[300px]"
                            onClick={e => e.stopPropagation()}
                          >
                            {material.url}
                          </a>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-slate-400 text-xs">{material.article}</td>
                      <td className="px-2 sm:px-3 py-2 text-slate-400 text-xs">{material.brand}</td>
                      <td className="px-2 sm:px-3 py-2 text-slate-400">{material.unit}</td>
                      <td className="px-2 sm:px-3 py-2 text-right text-primary-400">{formatMoney(material.price)}</td>
                      <td className="px-2 sm:px-3 py-2 text-right text-slate-300">{material.quantity}</td>
                      <td className="px-2 sm:px-3 py-2 text-right font-medium text-primary-300">{formatMoney(material.total)}</td>
                      <td className="px-2 sm:px-3 py-2" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {material.url && (
                            <button
                              onClick={() => handleRefreshOne(material.id)}
                              disabled={refreshingItemId === material.id}
                              className="p-1.5 text-slate-400 hover:text-primary-400 transition-colors"
                              title="Обновить из ссылки"
                            >
                              <svg className={`w-4 h-4 ${refreshingItemId === material.id ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(material.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Удалить"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-600/50">
                  <td colSpan={7} className="px-2 sm:px-3 py-3 text-right font-semibold text-slate-300">
                    Итого:
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-right font-display font-bold text-primary-400 text-base">
                    {formatMoney(grandTotal)} ₽
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add URLs Modal */}
      {showAddModal && (
        <Modal
          title="Добавить материалы"
          maxWidth="max-w-2xl"
          onClose={() => { setShowAddModal(false); setParseProgress('') }}
          footer={
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowAddModal(false); setParseProgress('') }}
                className="btn-secondary"
                disabled={isParsing}
              >
                Отмена
              </button>
              <button
                onClick={handleParseUrls}
                disabled={isParsing || !urlsInput.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {isParsing ? (
                  <>
                    <Spinner size="sm" className="border-white" />
                    Парсинг...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Распознать через ИИ
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">
                Ссылки на товары (по одной на строку)
              </label>
              <textarea
                value={urlsInput}
                onChange={e => setUrlsInput(e.target.value)}
                placeholder={`https://example.com/product-1\nhttps://example.com/product-2\nhttps://example.com/product-3`}
                className="input-field min-h-[200px] font-mono text-sm"
                rows={8}
                disabled={isParsing}
              />
              <p className="text-xs text-slate-500 mt-2">
                Вставьте ссылки на страницы товаров интернет-магазинов. ИИ автоматически извлечёт название, цену, артикул и характеристики.
              </p>
            </div>

            {parseProgress && (
              <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                <Spinner size="sm" className="flex-shrink-0" />
                <span className="text-sm text-primary-300">{parseProgress}</span>
              </div>
            )}
          </div>
        </Modal>
      )}

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

