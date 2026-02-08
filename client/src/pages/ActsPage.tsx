import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { projectsApi, SavedAct, SavedActDetail } from '../services/api'
import { amountToWordsRu } from '../utils/numberToWords'

const MONTH_NAMES_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

function formatDateRu(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate().toString().padStart(2, '0')
  const month = MONTH_NAMES_RU[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year} г.`
}

function formatMoney(num: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const thStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: 'bold',
  backgroundColor: '#fff',
}

const tdStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px 8px',
  verticalAlign: 'top',
}

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
    } catch {
      // ok
    }
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

  const findBestSplitY = (canvas: HTMLCanvasElement, targetY: number, searchRange: number): number => {
    const ctx = canvas.getContext('2d')!
    const w = canvas.width

    const lo = Math.max(0, Math.floor(targetY - searchRange))
    const hi = Math.min(canvas.height - 1, Math.ceil(targetY + searchRange))

    let bestY = Math.round(targetY)
    let bestScore = -1

    for (let y = lo; y <= hi; y++) {
      const row = ctx.getImageData(0, y, w, 1).data
      let whites = 0
      for (let i = 0; i < row.length; i += 4) {
        if (row[i] > 240 && row[i + 1] > 240 && row[i + 2] > 240) whites++
      }
      const score = whites / w
      if (score > bestScore) {
        bestScore = score
        bestY = y
      }
    }
    return bestY
  }

  const handleDownloadPdf = async () => {
    if (!actRef.current || !selectedAct) return
    setIsGeneratingPdf(true)

    try {
      const scale = 2
      const canvas = await html2canvas(actRef.current, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const canvasWidthOriginal = canvas.width / scale
      const mmPerPx = pdfWidth / canvasWidthOriginal
      const pageHeightPx = pdfHeight / mmPerPx * scale
      const searchRange = Math.round(pageHeightPx * 0.08)

      let yOffset = 0
      let pageNum = 0

      while (yOffset < canvas.height) {
        if (pageNum > 0) pdf.addPage()

        let cropEnd: number
        const idealEnd = yOffset + pageHeightPx

        if (idealEnd >= canvas.height) {
          cropEnd = canvas.height
        } else {
          cropEnd = findBestSplitY(canvas, idealEnd, searchRange)
        }

        const cropHeight = cropEnd - yOffset
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = cropHeight

        const ctx = pageCanvas.getContext('2d')!
        ctx.drawImage(
          canvas,
          0, yOffset, canvas.width, cropHeight,
          0, 0, canvas.width, cropHeight
        )

        const pageImgData = pageCanvas.toDataURL('image/png')
        const pageHeightMm = (cropHeight / scale) * mmPerPx

        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pageHeightMm)

        yOffset = cropEnd
        pageNum++
      }

      pdf.save(`Акт_${selectedAct.actNumber || 'б-н'}_${selectedAct.actDate}.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Ошибка при создании PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Build act lines for the preview from selected act's items
  // Filter out items that are just references (when selectionMode was 'sections', we saved both section lines and item references)
  const getActPreviewLines = (act: SavedActDetail) => {
    if (act.selectionMode === 'sections') {
      // In sections mode, we saved section-level lines (no itemId) plus individual item refs (with itemId).
      // Show only the section-level lines for the PDF.
      const sectionLines = act.items.filter(i => !i.itemId && i.sectionId)
      if (sectionLines.length > 0) return sectionLines
    }
    // In items mode, or if no section lines found, show items with itemId
    const itemLines = act.items.filter(i => i.itemId)
    if (itemLines.length > 0) return itemLines
    // Fallback: show all items
    return act.items
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate(`/projects/${id}/edit`)}
            className="text-slate-400 hover:text-white mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к проекту
          </button>
          <h1 className="font-display text-2xl font-bold text-white">
            {selectedAct ? `Акт №${selectedAct.actNumber}` : 'Акты выполненных работ'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {selectedAct ? (
            <>
              <button
                onClick={() => setSelectedAct(null)}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                К списку
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isGeneratingPdf ? 'Генерация...' : 'Скачать PDF'}
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/projects/${id}/act`)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Создать акт
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
            <div
              ref={actRef}
              style={{
                width: '794px',
                padding: '50px 55px',
                fontFamily: "'Times New Roman', 'DejaVu Serif', Georgia, serif",
                color: '#000',
                backgroundColor: '#fff',
                fontSize: '14px',
                lineHeight: '1.5',
                boxSizing: 'border-box',
              }}
            >
              {/* Header: logo + title */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                <div style={{ width: '100px', flexShrink: 0 }}>
                  {images.logo && (
                    <img src={images.logo} alt="Логотип" style={{ maxWidth: '100px', maxHeight: '80px' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', padding: 0 }}>
                    Акт № {selectedAct.actNumber} от {formatDateRu(selectedAct.actDate)}
                  </h1>
                  <div style={{ borderBottom: '3px solid #000', width: '100%' }}></div>
                </div>
              </div>

              {/* Parties */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                  <span style={{ whiteSpace: 'nowrap', minWidth: '100px' }}>Исполнитель:</span>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px' }}>
                    {selectedAct.executorName}{selectedAct.executorDetails ? `, ${selectedAct.executorDetails}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <span style={{ whiteSpace: 'nowrap', minWidth: '100px' }}>Заказчик:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedAct.customerName}</span>
                </div>
              </div>

              {/* Table */}
              {(() => {
                const lines = getActPreviewLines(selectedAct)
                const total = selectedAct.grandTotal
                return (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>№</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Услуга</th>
                          <th style={thStyle}>кол-во</th>
                          <th style={thStyle}>Ед.</th>
                          <th style={thStyle}>НДС</th>
                          <th style={thStyle}>Цена</th>
                          <th style={thStyle}>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line, idx) => (
                          <tr key={line.id}>
                            <td style={{ ...tdStyle, textAlign: 'center', width: '35px' }}>{idx + 1}</td>
                            <td style={{ ...tdStyle }}>{line.name}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', width: '55px' }}>{line.quantity}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', width: '40px' }}>{line.unit}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', width: '70px' }}>Без НДС</td>
                            <td style={{ ...tdStyle, textAlign: 'right', width: '95px' }}>{formatMoney(line.price)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', width: '95px' }}>{formatMoney(line.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Total */}
                    <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '20px', fontSize: '14px' }}>
                      Итого к оплате: <span style={{ marginLeft: '40px' }}>{formatMoney(total)}</span>
                    </div>

                    {/* Text */}
                    <div style={{ marginBottom: '6px', fontSize: '13px' }}>
                      Всего оказано услуг на сумму {formatMoney(total)} руб.
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '13px' }}>
                      {amountToWordsRu(total)}
                    </div>
                  </>
                )
              })()}

              {/* Disclaimer */}
              <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                Вышеперечисленные услуги оказаны в полном объеме и в установленный срок. Заказчик не имеет претензий по качеству, срокам
                и объемам оказанных услуг.
              </div>
              <div style={{ borderTop: '2px solid #000', marginBottom: '40px' }}></div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', minHeight: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                  <span>директор</span>
                  <span style={{
                    display: 'inline-block',
                    width: '120px',
                    borderBottom: '1px solid #000',
                    marginLeft: '10px',
                    marginRight: '10px',
                    position: 'relative',
                  }}>
                    {images.signature && (
                      <img
                        src={images.signature}
                        alt=""
                        style={{
                          position: 'absolute',
                          bottom: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          maxWidth: '100px',
                          maxHeight: '50px',
                        }}
                      />
                    )}
                  </span>
                  <span>{selectedAct.directorName}</span>
                </div>

                {images.stamp && (
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '-15px',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                  }}>
                    <img src={images.stamp} alt="" style={{ maxWidth: '180px', maxHeight: '180px' }} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                  <span>Заказчик</span>
                  <span style={{
                    display: 'inline-block',
                    width: '120px',
                    borderBottom: '1px solid #000',
                    marginLeft: '10px',
                  }}></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Acts list */
        <div>
          {acts.length === 0 ? (
            <div className="card text-center py-16">
              <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="font-display text-xl font-bold text-white mb-2">Пока нет актов</h2>
              <p className="text-slate-400 mb-6 text-sm">Создайте акт и скачайте PDF — он автоматически сохранится в истории</p>
              <button
                onClick={() => navigate(`/projects/${id}/act`)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать первый акт
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {acts.map(act => (
                <div
                  key={act.id}
                  className="card flex items-center justify-between hover:border-slate-600/80 transition-colors group"
                >
                  <button
                    onClick={() => handleSelectAct(act.id)}
                    className="flex-1 text-left py-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
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
                    <button
                      onClick={() => handleSelectAct(act.id)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors"
                      title="Просмотреть и скачать PDF"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteAct(act.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Удалить"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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

