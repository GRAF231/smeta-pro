import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { EstimateSection, EstimateView, projectsApi } from '../services/api'
import { amountToWordsRu } from '../utils/numberToWords'

interface ActGeneratorProps {
  projectId: string
  sections: EstimateSection[]
  views: EstimateView[]
  onBack: () => void
}

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

interface ActLine {
  number: number
  name: string
  quantity: number
  unit: string
  price: number
  total: number
}

type ImageType = 'logo' | 'stamp' | 'signature'
const IMAGE_LABELS: Record<ImageType, string> = {
  logo: 'Логотип',
  stamp: 'Печать',
  signature: 'Подпись',
}

export default function ActGenerator({ projectId, sections, views, onBack }: ActGeneratorProps) {
  const [step, setStep] = useState<'config' | 'preview'>('config')

  // Selected view for pricing
  const [selectedViewId, setSelectedViewId] = useState<string>(views[0]?.id || '')

  // Act config
  const [actNumber, setActNumber] = useState('')
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0])
  const [executorName, setExecutorName] = useState('')
  const [executorDetails, setExecutorDetails] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [directorName, setDirectorName] = useState('')
  const [serviceName, setServiceName] = useState('Оказание услуг по комплектации и снабжению')

  // Selection
  const [selectionMode, setSelectionMode] = useState<'sections' | 'items'>('sections')
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Images (base64 data URLs)
  const [images, setImages] = useState<Record<string, string>>({})
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)

  // PDF
  const actRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Helper: get item price/total for selected view
  const getItemPrice = (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }) => {
    const vs = item.viewSettings[selectedViewId]
    return vs?.price ?? 0
  }

  const getItemTotal = (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }) => {
    const vs = item.viewSettings[selectedViewId]
    return vs?.total ?? 0
  }

  // Load saved config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`act-config-${projectId}`)
      if (saved) {
        const config = JSON.parse(saved)
        if (config.executorName) setExecutorName(config.executorName)
        if (config.executorDetails) setExecutorDetails(config.executorDetails)
        if (config.customerName) setCustomerName(config.customerName)
        if (config.directorName) setDirectorName(config.directorName)
        if (config.serviceName) setServiceName(config.serviceName)
      }
    } catch { /* ignore parse errors */ }
  }, [projectId])

  // Load images from server
  useEffect(() => {
    loadImages()
  }, [projectId])

  const loadImages = async () => {
    try {
      const res = await projectsApi.getActImages(projectId)
      setImages(res.data)
    } catch {
      // Images may not exist yet, that's ok
    }
  }

  // Save config on change
  const saveConfig = useCallback(() => {
    localStorage.setItem(`act-config-${projectId}`, JSON.stringify({
      executorName, executorDetails, customerName, directorName, serviceName,
    }))
  }, [projectId, executorName, executorDetails, customerName, directorName, serviceName])

  useEffect(() => {
    saveConfig()
  }, [saveConfig])

  // Handle image upload
  const handleImageUpload = async (imageType: ImageType, file: File) => {
    setUploadingImage(imageType)
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      await projectsApi.uploadActImage(projectId, imageType, dataUrl)
      setImages(prev => ({ ...prev, [imageType]: dataUrl }))
    } catch {
      alert('Ошибка загрузки изображения')
    } finally {
      setUploadingImage(null)
    }
  }

  // Handle image delete
  const handleImageDelete = async (imageType: ImageType) => {
    try {
      await projectsApi.deleteActImage(projectId, imageType)
      setImages(prev => {
        const next = { ...prev }
        delete next[imageType]
        return next
      })
    } catch {
      alert('Ошибка удаления изображения')
    }
  }

  // Toggle section selection
  const toggleSection = (sectionId: string) => {
    const next = new Set(selectedSections)
    const section = sections.find(s => s.id === sectionId)

    if (next.has(sectionId)) {
      next.delete(sectionId)
      if (section) {
        const nextItems = new Set(selectedItems)
        section.items.forEach(item => nextItems.delete(item.id))
        setSelectedItems(nextItems)
      }
    } else {
      next.add(sectionId)
      if (section) {
        const nextItems = new Set(selectedItems)
        section.items.forEach(item => nextItems.add(item.id))
        setSelectedItems(nextItems)
      }
    }
    setSelectedSections(next)
  }

  // Toggle individual item selection
  const toggleItem = (sectionId: string, itemId: string) => {
    const next = new Set(selectedItems)
    if (next.has(itemId)) {
      next.delete(itemId)
    } else {
      next.add(itemId)
    }
    setSelectedItems(next)

    const section = sections.find(s => s.id === sectionId)
    if (section) {
      const nextSections = new Set(selectedSections)
      const allSelected = section.items.every(i => next.has(i.id))
      const anySelected = section.items.some(i => next.has(i.id))
      if (allSelected && section.items.length > 0) {
        nextSections.add(sectionId)
      } else if (!anySelected) {
        nextSections.delete(sectionId)
      }
      setSelectedSections(nextSections)
    }
  }

  const selectAll = () => {
    setSelectedSections(new Set(sections.map(s => s.id)))
    setSelectedItems(new Set(sections.flatMap(s => s.items.map(i => i.id))))
  }

  const deselectAll = () => {
    setSelectedSections(new Set())
    setSelectedItems(new Set())
  }

  // Calculate act line items
  const getActLines = (): ActLine[] => {
    const lines: ActLine[] = []
    let num = 1

    if (selectionMode === 'sections') {
      sections.forEach(section => {
        if (!selectedSections.has(section.id)) return

        const selectedSectionItems = section.items.filter(item => selectedItems.has(item.id))
        const sectionTotal = selectedSectionItems.reduce((sum, item) => sum + getItemTotal(item), 0)

        if (sectionTotal > 0) {
          lines.push({
            number: num++,
            name: section.name,
            quantity: 1,
            unit: '-',
            price: sectionTotal,
            total: sectionTotal,
          })
        }
      })
    } else {
      sections.forEach(section => {
        section.items.forEach(item => {
          if (!selectedItems.has(item.id)) return

          lines.push({
            number: num++,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || '-',
            price: getItemPrice(item),
            total: getItemTotal(item),
          })
        })
      })
    }

    return lines
  }

  const actLines = getActLines()
  const grandTotal = actLines.reduce((sum, line) => sum + line.total, 0)

  /**
   * Scan the canvas near `targetY` (±searchRange) and return the Y coordinate
   * of the row that is closest to pure white — i.e. a gap between lines of text.
   */
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

  // Generate and download PDF
  const handleDownload = async () => {
    if (!actRef.current) return
    setIsGenerating(true)

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

      // Margin we're willing to look up/down from the ideal split for a white gap
      const searchRange = Math.round(pageHeightPx * 0.08) // ~8 % of page height

      let yOffset = 0
      let pageNum = 0

      while (yOffset < canvas.height) {
        if (pageNum > 0) pdf.addPage()

        let cropEnd: number
        const idealEnd = yOffset + pageHeightPx

        if (idealEnd >= canvas.height) {
          // Last page — take everything remaining
          cropEnd = canvas.height
        } else {
          // Find the best white-space row near the ideal page boundary
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

      pdf.save(`Акт_${actNumber || 'б-н'}_${actDate}.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Ошибка при создании PDF. Попробуйте ещё раз.')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasSelection = actLines.length > 0
  const canPreview = actNumber.trim() && customerName.trim() && executorName.trim() && hasSelection

  // File input helper
  const openFileDialog = (imageType: ImageType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleImageUpload(imageType, file)
    }
    input.click()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button onClick={onBack} className="text-slate-400 hover:text-white mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к проекту
          </button>
          <h1 className="font-display text-2xl font-bold text-white">
            {step === 'config' ? 'Создание акта выполненных работ' : 'Предпросмотр акта'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('config')}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад к настройке
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isGenerating ? 'Генерация...' : 'Скачать PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      <div>
          {step === 'config' ? (
            <div className="space-y-6">

              {/* View selector for pricing */}
              {views.length > 1 && (
                <div className="card">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    Цены из представления
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {views.map(view => (
                      <button
                        key={view.id}
                        onClick={() => setSelectedViewId(view.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedViewId === view.id
                            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                        }`}
                      >
                        {view.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Выберите, цены из какого представления использовать для расчёта акта
                  </p>
                </div>
              )}

              {/* Images Upload */}
              <div className="card space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-green-400 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Изображения для акта
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['logo', 'stamp', 'signature'] as ImageType[]).map(type => (
                    <div key={type} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                      <div className="text-sm text-slate-400 mb-3 font-medium">{IMAGE_LABELS[type]}</div>
                      {images[type] ? (
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-2 flex items-center justify-center" style={{ minHeight: '80px' }}>
                            <img
                              src={images[type]}
                              alt={IMAGE_LABELS[type]}
                              className="max-h-20 max-w-full object-contain"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openFileDialog(type)}
                              disabled={uploadingImage === type}
                              className="flex-1 text-xs px-3 py-1.5 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                              Заменить
                            </button>
                            <button
                              onClick={() => handleImageDelete(type)}
                              className="text-xs px-3 py-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openFileDialog(type)}
                          disabled={uploadingImage === type}
                          className="w-full border-2 border-dashed border-slate-600 rounded-lg py-6 flex flex-col items-center gap-2 hover:border-primary-500/50 hover:bg-slate-700/30 transition-all cursor-pointer"
                        >
                          {uploadingImage === type ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                          ) : (
                            <>
                              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-xs text-slate-500">Загрузить PNG/JPG</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Act Details */}
              <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Номер акта *</label>
                  <input
                    type="text"
                    value={actNumber}
                    onChange={e => setActNumber(e.target.value)}
                    placeholder="170"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Дата акта</label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={e => setActDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Executor & Customer & Signature */}
              <div className="card space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">И</div>
                  Исполнитель
                </h3>
                <div>
                  <label className="label">Наименование исполнителя *</label>
                  <input
                    type="text"
                    value={executorName}
                    onChange={e => setExecutorName(e.target.value)}
                    placeholder="ИП Чурина Елизавета Алексеевна"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Реквизиты (ИНН, адрес и т.д.)</label>
                  <textarea
                    value={executorDetails}
                    onChange={e => setExecutorDetails(e.target.value)}
                    placeholder="ИНН 665404395460, 623640, Россия, Свердловская обл, Талицкий р-н, г Талица, ул Кузнецова, д 62, кв 2"
                    className="input-field min-h-[80px]"
                    rows={2}
                  />
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded bg-accent-500/20 flex items-center justify-center text-accent-400 text-xs font-bold">З</div>
                    Заказчик
                  </h3>
                  <div>
                    <label className="label">ФИО заказчика *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Шаповалова Елена Владимировна"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <h3 className="font-semibold text-white mb-4">Подпись</h3>
                  <div>
                    <label className="label">ФИО директора (для подписи)</label>
                    <input
                      type="text"
                      value={directorName}
                      onChange={e => setDirectorName(e.target.value)}
                      placeholder="Чурина Е.А."
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Selection Mode */}
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Выберите позиции для акта</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={selectAll} className="text-xs text-primary-400 hover:text-primary-300">Выбрать всё</button>
                    <span className="text-slate-600">|</span>
                    <button onClick={deselectAll} className="text-xs text-slate-400 hover:text-slate-300">Снять всё</button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectionMode('sections')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectionMode === 'sections'
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                    }`}
                  >
                    По разделам
                  </button>
                  <button
                    onClick={() => setSelectionMode('items')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectionMode === 'items'
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                    }`}
                  >
                    По позициям
                  </button>
                </div>

                {/* Sections / Items checkboxes */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {sections.map(section => (
                    <div key={section.id} className="bg-slate-700/20 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center gap-3 px-4 py-3 bg-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors"
                        onClick={() => toggleSection(section.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSections.has(section.id)}
                          onChange={() => toggleSection(section.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="font-medium text-white text-sm flex-1">{section.name}</span>
                        <span className="text-xs text-slate-400">
                          {section.items.filter(i => selectedItems.has(i.id)).length} / {section.items.length} поз.
                        </span>
                      </div>

                      {selectionMode === 'items' && (
                        <div className="px-4 py-2 space-y-1">
                          {section.items.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 px-3 py-1.5 rounded hover:bg-slate-700/30 cursor-pointer transition-colors"
                              onClick={() => toggleItem(section.id, item.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItem(section.id, item.id)}
                                onClick={e => e.stopPropagation()}
                                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500"
                              />
                              <span className="text-sm text-slate-300 flex-1">{item.name}</span>
                              <span className="text-xs text-slate-500">{formatMoney(getItemTotal(item))} ₽</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {hasSelection && (
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Итого в акте: <strong className="text-white">{actLines.length}</strong> {
                        selectionMode === 'sections' ? 'разделов' : 'позиций'
                      }
                    </span>
                    <span className="font-display font-bold text-primary-400 text-lg">
                      {formatMoney(grandTotal)} ₽
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Step */
            <div>
              <div className="bg-white rounded-xl shadow-lg overflow-auto mx-auto" style={{ maxWidth: '850px' }}>
                {/* The actual act document rendered for capture */}
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
                        <img
                          src={images.logo}
                          alt="Логотип"
                          style={{ maxWidth: '100px', maxHeight: '80px' }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h1 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        margin: '0 0 8px 0',
                        padding: 0,
                      }}>
                        Акт № {actNumber} от {formatDateRu(actDate)}
                      </h1>
                      <div style={{ borderBottom: '3px solid #000', width: '100%' }}></div>
                    </div>
                  </div>

                  {/* Parties */}
                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                      <span style={{ whiteSpace: 'nowrap', minWidth: '100px' }}>Исполнитель:</span>
                      <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px' }}>
                        {executorName}{executorDetails ? `, ${executorDetails}` : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <span style={{ whiteSpace: 'nowrap', minWidth: '100px' }}>Заказчик:</span>
                      <span style={{ fontWeight: 'bold' }}>{customerName}</span>
                    </div>
                  </div>

                  {/* Table */}
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '8px',
                    fontSize: '13px',
                  }}>
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
                      {actLines.map(line => (
                        <tr key={line.number}>
                          <td style={{ ...tdStyle, textAlign: 'center', width: '35px' }}>{line.number}</td>
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
                  <div style={{
                    textAlign: 'right',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    fontSize: '14px',
                  }}>
                    Итого к оплате: <span style={{ marginLeft: '40px' }}>{formatMoney(grandTotal)}</span>
                  </div>

                  {/* Text */}
                  <div style={{ marginBottom: '6px', fontSize: '13px' }}>
                    Всего оказано услуг на сумму {formatMoney(grandTotal)} руб.
                  </div>
                  <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '13px' }}>
                    {amountToWordsRu(grandTotal)}
                  </div>

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
                        {/* Signature image overlay */}
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
                      <span>{directorName}</span>
                    </div>

                    {/* Stamp in center */}
                    {images.stamp && (
                      <div style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: '-15px',
                        transform: 'translateX(-50%)',
                        zIndex: 1,
                      }}>
                        <img
                          src={images.stamp}
                          alt=""
                          style={{ maxWidth: '180px', maxHeight: '180px' }}
                        />
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
          )}
        </div>

      {/* Footer */}
      {step === 'config' && (
        <div className="flex items-center justify-end mt-6">
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
  )
}

// Table cell styles
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
