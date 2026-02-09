import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, SavedAct, SavedActDetail } from '../services/api'
import { formatMoney } from '../utils/format'
import { renderToPdf } from '../utils/pdfGenerator'
import { PageSpinner } from '../components/ui/Spinner'
import ErrorAlert from '../components/ui/ErrorAlert'
import BackButton from '../components/ui/BackButton'
import { IconPlus, IconBack, IconDownload, IconEye, IconTrash, IconDocument } from '../components/ui/Icons'
import ActDocumentTemplate, { ActLine } from '../components/ActGenerator/ActDocumentTemplate'

export default function ActsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [acts, setActs] = useState<SavedAct[]>([])
  const [selectedAct, setSelectedAct] = useState<SavedActDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [images, setImages] = useState<Record<string, string>>({})
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const actRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      loadActs()
      loadImages()
    }
  }, [id])

  const loadActs = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const res = await projectsApi.getActs(id)
      setActs(res.data)
    } catch {
      setError('Ошибка загрузки актов')
    } finally {
      setIsLoading(false)
    }
  }

  const loadImages = async () => {
    if (!id) return
    try {
      const res = await projectsApi.getActImages(id)
      setImages(res.data)
    } catch { /* ok */ }
  }

  const handleSelectAct = async (actId: string) => {
    if (!id) return
    try {
      const res = await projectsApi.getAct(id, actId)
      setSelectedAct(res.data)
    } catch {
      setError('Ошибка загрузки акта')
    }
  }

  const handleDeleteAct = async (actId: string) => {
    if (!id) return
    if (!confirm('Удалить этот акт из истории?')) return
    try {
      await projectsApi.deleteAct(id, actId)
      setActs(acts.filter(a => a.id !== actId))
      if (selectedAct?.id === actId) setSelectedAct(null)
    } catch {
      setError('Ошибка удаления акта')
    }
  }

  const handleDownloadPdf = async () => {
    if (!actRef.current || !selectedAct) return
    setIsGeneratingPdf(true)
    try {
      await renderToPdf(actRef.current, `Акт_${selectedAct.actNumber || 'б-н'}_${selectedAct.actDate}.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Ошибка при создании PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Build act lines for the preview from selected act's items
  const getActPreviewLines = (act: SavedActDetail): ActLine[] => {
    let items = act.items
    if (act.selectionMode === 'sections') {
      const sectionLines = act.items.filter(i => !i.itemId && i.sectionId)
      if (sectionLines.length > 0) items = sectionLines
    } else {
      const itemLines = act.items.filter(i => i.itemId)
      if (itemLines.length > 0) items = itemLines
    }
    // Fallback: show all items if no filter matched
    return items.map((item, idx) => ({
      number: idx + 1,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      total: item.total,
    }))
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <BackButton to={`/projects/${id}/edit`} label="Назад к проекту" />
          <h1 className="font-display text-2xl font-bold text-white">
            {selectedAct ? `Акт №${selectedAct.actNumber}` : 'Акты выполненных работ'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {selectedAct ? (
            <>
              <button onClick={() => setSelectedAct(null)} className="btn-secondary flex items-center gap-2">
                <IconBack className="w-4 h-4" />
                К списку
              </button>
              <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="btn-primary flex items-center gap-2">
                <IconDownload className="w-4 h-4" />
                {isGeneratingPdf ? 'Генерация...' : 'Скачать PDF'}
              </button>
            </>
          ) : (
            <button onClick={() => navigate(`/projects/${id}/act`)} className="btn-primary flex items-center gap-2">
              <IconPlus className="w-5 h-5" />
              Создать акт
            </button>
          )}
        </div>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {selectedAct ? (
        /* Act Preview for PDF download */
        <div>
          {/* Info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Дата</div>
              <div className="text-white text-sm">{selectedAct.actDate}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Сумма</div>
              <div className="text-primary-400 font-semibold">{formatMoney(selectedAct.grandTotal)} ₽</div>
            </div>
            {selectedAct.executorName && (
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Исполнитель</div>
                <div className="text-white text-sm truncate">{selectedAct.executorName}</div>
              </div>
            )}
            {selectedAct.customerName && (
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Заказчик</div>
                <div className="text-white text-sm truncate">{selectedAct.customerName}</div>
              </div>
            )}
          </div>

          {/* PDF preview */}
          <div className="bg-white rounded-xl shadow-lg overflow-auto mx-auto" style={{ maxWidth: '850px' }}>
            <ActDocumentTemplate
              ref={actRef}
              actNumber={selectedAct.actNumber}
              actDate={selectedAct.actDate}
              executorName={selectedAct.executorName}
              executorDetails={selectedAct.executorDetails}
              customerName={selectedAct.customerName}
              directorName={selectedAct.directorName}
              actLines={getActPreviewLines(selectedAct)}
              grandTotal={selectedAct.grandTotal}
              images={images}
            />
          </div>
        </div>
      ) : (
        /* Acts list */
        <div>
          {acts.length === 0 ? (
            <div className="card text-center py-16">
              <IconDocument className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h2 className="font-display text-xl font-bold text-white mb-2">Пока нет актов</h2>
              <p className="text-slate-400 mb-6 text-sm">Создайте акт и скачайте PDF — он автоматически сохранится в истории</p>
              <button onClick={() => navigate(`/projects/${id}/act`)} className="btn-primary inline-flex items-center gap-2">
                <IconPlus className="w-5 h-5" />
                Создать первый акт
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {acts.map(act => (
                <div key={act.id} className="card flex items-center justify-between hover:border-slate-600/80 transition-colors group">
                  <button onClick={() => handleSelectAct(act.id)} className="flex-1 text-left py-1">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <IconDocument className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white">Акт №{act.actNumber}</span>
                          <span className="text-sm text-slate-400">{act.actDate}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-sm text-primary-400 font-medium">{formatMoney(act.grandTotal)} ₽</span>
                          {act.customerName && <span className="text-xs text-slate-500">• {act.customerName}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => handleSelectAct(act.id)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors" title="Просмотреть и скачать PDF">
                      <IconEye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteAct(act.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Удалить">
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
