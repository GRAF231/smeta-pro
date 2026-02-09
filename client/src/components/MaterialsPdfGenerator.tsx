import { useState, useRef, useEffect, useCallback } from 'react'
import { Material, projectsApi } from '../services/api'
import { formatMoney, formatDateShortRu } from '../utils/format'
import { renderToPdf } from '../utils/pdfGenerator'
import { IconBack, IconDownload, IconEye, IconClose } from './ui/Icons'

interface MaterialsPdfGeneratorProps {
  projectId: string
  materials: Material[]
  projectTitle: string
  onClose: () => void
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

  useEffect(() => { saveConfig() }, [saveConfig])

  const grandTotal = materials.reduce((sum, m) => sum + m.total, 0)

  const handleDownload = async () => {
    if (!docRef.current) return
    setIsGenerating(true)
    try {
      await renderToPdf(docRef.current, `КП_${kpNumber || 'б-н'}_${projectTitle}_${kpDate}.pdf`)
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
              <button onClick={() => setStep('config')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <IconBack className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-display text-xl font-bold text-white">
              {step === 'config' ? 'Коммерческое предложение' : 'Предпросмотр КП'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <button onClick={handleDownload} disabled={isGenerating} className="btn-primary flex items-center gap-2 text-sm py-2">
                <IconDownload className="w-4 h-4" />
                {isGenerating ? 'Генерация...' : 'Скачать PDF'}
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <IconClose className="w-5 h-5" />
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
                  <input type="text" value={kpNumber} onChange={e => setKpNumber(e.target.value)} placeholder="3574" className="input-field" />
                </div>
                <div>
                  <label className="label">Дата КП</label>
                  <input type="date" value={kpDate} onChange={e => setKpDate(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label">Срок действия (дней)</label>
                  <input type="number" value={validDays} onChange={e => setValidDays(e.target.value)} placeholder="10" className="input-field" />
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
                  <input type="text" value={executorName} onChange={e => setExecutorName(e.target.value)} placeholder="ИП Чурина Елизавета Алексеевна" className="input-field" />
                </div>
                <div>
                  <label className="label">Адрес, контакты</label>
                  <textarea value={executorDetails} onChange={e => setExecutorDetails(e.target.value)} placeholder="Свердловская обл, г Талица, ул Кузнецова, д 62, кв 2, тел: +7(922)606-19-11 e-mail: info@example.com" className="input-field min-h-[80px]" rows={2} />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Материалов в КП: <strong className="text-white">{materials.length}</strong></span>
                  <span className="font-display font-bold text-primary-400 text-lg">{formatMoney(grandTotal)} ₽</span>
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
                      <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>{executorDetails}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{executorName}</div>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', margin: '20px 0 25px 0', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '10px 0' }}>
                    КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ {kpNumber ? `№ ${kpNumber}` : ''} от {formatDateShortRu(kpDate)}
                  </div>

                  {/* Materials table */}
                  {materials.map((material, index) => (
                    <div key={material.id} style={{ marginBottom: '3px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th style={{ ...tdStyleKP, textAlign: 'center', width: '50px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                              {index === 0 ? '№ 1' : `№ ${index + 1}`}
                            </th>
                            <th style={{ ...tdStyleKP, textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Наименование</th>
                            <th style={{ ...tdStyleKP, textAlign: 'center', width: '50px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Е.И.</th>
                            <th style={{ ...tdStyleKP, textAlign: 'center', width: '80px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Цена</th>
                            <th style={{ ...tdStyleKP, textAlign: 'center', width: '55px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Кол-во</th>
                            <th style={{ ...tdStyleKP, textAlign: 'center', width: '90px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Сумма</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ ...tdStyleKP, textAlign: 'center', width: '50px' }}></td>
                            <td style={{ ...tdStyleKP, fontWeight: 'bold' }}>{material.name}</td>
                            <td style={{ ...tdStyleKP, textAlign: 'center', width: '50px' }}>{material.unit}</td>
                            <td style={{ ...tdStyleKP, textAlign: 'right', width: '80px' }}>{formatMoney(material.price)}</td>
                            <td style={{ ...tdStyleKP, textAlign: 'center', width: '55px' }}>{material.quantity}</td>
                            <td style={{ ...tdStyleKP, textAlign: 'right', width: '90px', fontWeight: 'bold' }}>{formatMoney(material.total)}</td>
                          </tr>
                          {material.description && (
                            <tr>
                              <td style={{ ...tdStyleKP, border: 'none' }}></td>
                              <td colSpan={5} style={{ ...tdStyleKP, border: 'none', fontSize: '11px', color: '#555', padding: '4px 8px 8px 8px' }}>
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
                  <div style={{ marginTop: '20px', padding: '10px 0', borderTop: '2px solid #000', fontSize: '14px' }}>
                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>Итого на сумму {formatMoney(grandTotal)} руб.</div>
                  </div>

                  {/* Validity */}
                  <div style={{ marginTop: '15px', fontSize: '12px', color: '#555' }}>
                    Предложение действительно в течение {validDays || '10'} дней.
                  </div>

                  {/* Stamp & Signature area */}
                  <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', minHeight: '100px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#555', marginBottom: '5px' }}>{executorName}</div>
                      {images.signature && <img src={images.signature} alt="" style={{ maxWidth: '100px', maxHeight: '50px' }} />}
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
              <IconEye className="w-5 h-5" />
              Предпросмотр
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const tdStyleKP: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '6px 8px',
  verticalAlign: 'top',
  fontSize: '12px',
}
