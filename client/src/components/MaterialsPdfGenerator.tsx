import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Material, projectsApi } from '../services/api'

interface MaterialsPdfGeneratorProps {
  projectId: string
  materials: Material[]
  projectTitle: string
  onClose: () => void
}

function formatMoney(num: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

function formatDateRu(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

export default function MaterialsPdfGenerator({
  projectId,
  materials,
  projectTitle,
  onClose,
}: MaterialsPdfGeneratorProps) {
  const [step, setStep] = useState<'config' | 'preview'>('config')

  // Config
  const [kpNumber, setKpNumber] = useState('')
  const [kpDate, setKpDate] = useState(new Date().toISOString().split('T')[0])
  const [executorName, setExecutorName] = useState('')
  const [executorDetails, setExecutorDetails] = useState('')
  const [validDays, setValidDays] = useState('10')

  // Images
  const [images, setImages] = useState<Record<string, string>>({})

  // PDF
  const docRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Load saved config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kp-config-${projectId}`)
      if (saved) {
        const config = JSON.parse(saved)
        if (config.executorName) setExecutorName(config.executorName)
        if (config.executorDetails) setExecutorDetails(config.executorDetails)
        if (config.validDays) setValidDays(config.validDays)
      }
      // Also try act-config for executor info
      const actSaved = localStorage.getItem(`act-config-${projectId}`)
      if (actSaved) {
        const actConfig = JSON.parse(actSaved)
        if (!executorName && actConfig.executorName) setExecutorName(actConfig.executorName)
        if (!executorDetails && actConfig.executorDetails) setExecutorDetails(actConfig.executorDetails)
      }
    } catch { /* ignore */ }
  }, [projectId])

  // Load images (reuse act images)
  useEffect(() => {
    loadImages()
  }, [projectId])

  const loadImages = async () => {
    try {
      const res = await projectsApi.getActImages(projectId)
      setImages(res.data)
    } catch { /* ok */ }
  }

  // Save config
  const saveConfig = useCallback(() => {
    localStorage.setItem(`kp-config-${projectId}`, JSON.stringify({
      executorName, executorDetails, validDays,
    }))
  }, [projectId, executorName, executorDetails, validDays])

  useEffect(() => {
    saveConfig()
  }, [saveConfig])

  const grandTotal = materials.reduce((sum, m) => sum + m.total, 0)

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

  const handleDownload = async () => {
    if (!docRef.current) return
    setIsGenerating(true)
    try {
      const scale = 2
      const canvas = await html2canvas(docRef.current, {
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
        ctx.drawImage(canvas, 0, yOffset, canvas.width, cropHeight, 0, 0, canvas.width, cropHeight)
        const pageImgData = pageCanvas.toDataURL('image/png')
        const pageHeightMm = (cropHeight / scale) * mmPerPx
        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pageHeightMm)
        yOffset = cropEnd
        pageNum++
      }

      pdf.save(`КП_${kpNumber || 'б-н'}_${projectTitle}_${kpDate}.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Ошибка при создании PDF. Попробуйте ещё раз.')
    } finally {
      setIsGenerating(false)
    }
  }

  const canPreview = executorName.trim() && materials.length > 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <button
                onClick={() => setStep('config')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="font-display text-xl font-bold text-white">
              {step === 'config' ? 'Коммерческое предложение' : 'Предпросмотр КП'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="btn-primary flex items-center gap-2 text-sm py-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isGenerating ? 'Генерация...' : 'Скачать PDF'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'config' ? (
            <div className="p-6 space-y-6">
              {/* KP Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Номер КП</label>
                  <input
                    type="text"
                    value={kpNumber}
                    onChange={e => setKpNumber(e.target.value)}
                    placeholder="3574"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Дата КП</label>
                  <input
                    type="date"
                    value={kpDate}
                    onChange={e => setKpDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Срок действия (дней)</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={e => setValidDays(e.target.value)}
                    placeholder="10"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Executor */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">И</div>
                  Исполнитель *
                </h3>
                <div>
                  <label className="label">Наименование</label>
                  <input
                    type="text"
                    value={executorName}
                    onChange={e => setExecutorName(e.target.value)}
                    placeholder="ИП Чурина Елизавета Алексеевна"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Адрес, контакты</label>
                  <textarea
                    value={executorDetails}
                    onChange={e => setExecutorDetails(e.target.value)}
                    placeholder="Свердловская обл, г Талица, ул Кузнецова, д 62, кв 2, тел: +7(922)606-19-11 e-mail: info@example.com"
                    className="input-field min-h-[80px]"
                    rows={2}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    Материалов в КП: <strong className="text-white">{materials.length}</strong>
                  </span>
                  <span className="font-display font-bold text-primary-400 text-lg">
                    {formatMoney(grandTotal)} ₽
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-lg overflow-auto mx-auto" style={{ maxWidth: '850px' }}>
                <div
                  ref={docRef}
                  style={{
                    width: '794px',
                    padding: '40px 50px',
                    fontFamily: "'Times New Roman', 'DejaVu Serif', Georgia, serif",
                    color: '#000',
                    backgroundColor: '#fff',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Header with logo */}
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'flex-start' }}>
                    {images.logo && (
                      <div style={{ width: '80px', flexShrink: 0 }}>
                        <img src={images.logo} alt="Логотип" style={{ maxWidth: '80px', maxHeight: '60px' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                        {executorDetails}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                        {executorName}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    margin: '20px 0 25px 0',
                    borderTop: '2px solid #000',
                    borderBottom: '2px solid #000',
                    padding: '10px 0',
                  }}>
                    КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ {kpNumber ? `№ ${kpNumber}` : ''} от {formatDateRu(kpDate)}
                  </div>

                  {/* Materials table */}
                  {materials.map((material, index) => (
                    <div key={material.id} style={{ marginBottom: '3px' }}>
                      {/* Item header row */}
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '12px',
                      }}>
                        <thead>
                          {index === 0 && (
                            <tr>
                              <th style={thStyleKP}>№ {index + 1}</th>
                              <th style={{ ...thStyleKP, textAlign: 'left' }}>Наименование</th>
                              <th style={thStyleKP}>Е.И.</th>
                              <th style={thStyleKP}>Цена</th>
                              <th style={thStyleKP}>Кол-во</th>
                              <th style={thStyleKP}>Сумма</th>
                            </tr>
                          )}
                          {index > 0 && (
                            <tr>
                              <th style={{ ...tdStyleKP, textAlign: 'center', width: '50px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                № {index + 1}
                              </th>
                              <th style={{ ...tdStyleKP, textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Наименование</th>
                              <th style={{ ...tdStyleKP, textAlign: 'center', width: '50px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Е.И.</th>
                              <th style={{ ...tdStyleKP, textAlign: 'center', width: '80px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Цена</th>
                              <th style={{ ...tdStyleKP, textAlign: 'center', width: '55px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Кол-во</th>
                              <th style={{ ...tdStyleKP, textAlign: 'center', width: '90px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Сумма</th>
                            </tr>
                          )}
                        </thead>
                        <tbody>
                          {/* Product name and price row */}
                          <tr>
                            <td style={{ ...tdStyleKP, textAlign: 'center', width: '50px' }}></td>
                            <td style={{ ...tdStyleKP, fontWeight: 'bold' }}>
                              {material.name}
                            </td>
                            <td style={{ ...tdStyleKP, textAlign: 'center', width: '50px' }}>{material.unit}</td>
                            <td style={{ ...tdStyleKP, textAlign: 'right', width: '80px' }}>{formatMoney(material.price)}</td>
                            <td style={{ ...tdStyleKP, textAlign: 'center', width: '55px' }}>{material.quantity}</td>
                            <td style={{ ...tdStyleKP, textAlign: 'right', width: '90px', fontWeight: 'bold' }}>{formatMoney(material.total)}</td>
                          </tr>
                          {/* Description row */}
                          {material.description && (
                            <tr>
                              <td style={{ ...tdStyleKP, border: 'none' }}></td>
                              <td colSpan={5} style={{
                                ...tdStyleKP,
                                border: 'none',
                                fontSize: '11px',
                                color: '#555',
                                padding: '4px 8px 8px 8px',
                              }}>
                                {material.brand && <span style={{ fontWeight: 'bold' }}>Бренд {material.brand} </span>}
                                {material.article && <span>Артикул {material.article} </span>}
                                {material.description}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}

                  {/* Total */}
                  <div style={{
                    marginTop: '20px',
                    padding: '10px 0',
                    borderTop: '2px solid #000',
                    fontSize: '14px',
                  }}>
                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      Итого на сумму {formatMoney(grandTotal)} руб.
                    </div>
                  </div>

                  {/* Validity */}
                  <div style={{
                    marginTop: '15px',
                    fontSize: '12px',
                    color: '#555',
                  }}>
                    Предложение действительно в течение {validDays || '10'} дней.
                  </div>

                  {/* Stamp & Signature area */}
                  <div style={{
                    marginTop: '40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    position: 'relative',
                    minHeight: '100px',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#555', marginBottom: '5px' }}>{executorName}</div>
                      {images.signature && (
                        <img src={images.signature} alt="" style={{ maxWidth: '100px', maxHeight: '50px' }} />
                      )}
                    </div>
                    {images.stamp && (
                      <div style={{ position: 'absolute', left: '50%', bottom: '-10px', transform: 'translateX(-50%)' }}>
                        <img src={images.stamp} alt="" style={{ maxWidth: '150px', maxHeight: '150px' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'config' && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-slate-700 flex-shrink-0">
            <button
              onClick={() => setStep('preview')}
              disabled={!canPreview}
              className={`btn-primary flex items-center gap-2 ${!canPreview ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Предпросмотр
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const thStyleKP: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: 'bold',
  backgroundColor: '#f5f5f5',
  fontSize: '12px',
}

const tdStyleKP: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '6px 8px',
  verticalAlign: 'top',
  fontSize: '12px',
}

