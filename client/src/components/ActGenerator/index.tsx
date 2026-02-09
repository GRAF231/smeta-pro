import { useState, useRef, useEffect, useCallback } from 'react'
import { EstimateSection, EstimateView, UsedItemsMap, projectsApi } from '../../services/api'
import { formatMoney } from '../../utils/format'
import { renderToPdf } from '../../utils/pdfGenerator'
import { IconBack, IconDownload, IconEye, IconPlus } from '../ui/Icons'
import Spinner from '../ui/Spinner'
import ActDocumentTemplate, { ActLine } from './ActDocumentTemplate'

interface ActGeneratorProps {
  projectId: string
  sections: EstimateSection[]
  views: EstimateView[]
  onBack: () => void
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

  // Used items from previous acts
  const [usedItems, setUsedItems] = useState<UsedItemsMap>({})

  // PDF
  const actRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Helper: get item price/total for selected view
  const getItemPrice = (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }) => {
    return item.viewSettings[selectedViewId]?.price ?? 0
  }

  const getItemTotal = (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }) => {
    return item.viewSettings[selectedViewId]?.total ?? 0
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
    loadUsedItems()
  }, [projectId])

  const loadImages = async () => {
    try {
      const res = await projectsApi.getActImages(projectId)
      setImages(res.data)
    } catch { /* ok */ }
  }

  const loadUsedItems = async () => {
    try {
      const res = await projectsApi.getUsedItems(projectId)
      setUsedItems(res.data)
    } catch { /* ok */ }
  }

  // Save config on change
  const saveConfig = useCallback(() => {
    localStorage.setItem(`act-config-${projectId}`, JSON.stringify({
      executorName, executorDetails, customerName, directorName, serviceName,
    }))
  }, [projectId, executorName, executorDetails, customerName, directorName, serviceName])

  useEffect(() => { saveConfig() }, [saveConfig])

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

  const handleImageDelete = async (imageType: ImageType) => {
    try {
      await projectsApi.deleteActImage(projectId, imageType)
      setImages(prev => { const next = { ...prev }; delete next[imageType]; return next })
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

  const toggleItem = (sectionId: string, itemId: string) => {
    const next = new Set(selectedItems)
    if (next.has(itemId)) { next.delete(itemId) } else { next.add(itemId) }
    setSelectedItems(next)
    const section = sections.find(s => s.id === sectionId)
    if (section) {
      const nextSections = new Set(selectedSections)
      const allSelected = section.items.every(i => next.has(i.id))
      const anySelected = section.items.some(i => next.has(i.id))
      if (allSelected && section.items.length > 0) { nextSections.add(sectionId) } else if (!anySelected) { nextSections.delete(sectionId) }
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
          lines.push({ number: num++, name: section.name, quantity: 1, unit: '-', price: sectionTotal, total: sectionTotal })
        }
      })
    } else {
      sections.forEach(section => {
        section.items.forEach(item => {
          if (!selectedItems.has(item.id)) return
          lines.push({ number: num++, name: item.name, quantity: item.quantity, unit: item.unit || '-', price: getItemPrice(item), total: getItemTotal(item) })
        })
      })
    }
    return lines
  }

  const actLines = getActLines()
  const grandTotal = actLines.reduce((sum, line) => sum + line.total, 0)

  // Generate and download PDF
  const handleDownload = async () => {
    if (!actRef.current) return
    setIsGenerating(true)
    try {
      await renderToPdf(actRef.current, `Акт_${actNumber || 'б-н'}_${actDate}.pdf`)

      // Save act to database
      try {
        const actItemsToSave: { itemId?: string; sectionId?: string; name: string; unit: string; quantity: number; price: number; total: number }[] = []
        if (selectionMode === 'sections') {
          sections.forEach(section => {
            if (!selectedSections.has(section.id)) return
            const selectedSectionItems = section.items.filter(item => selectedItems.has(item.id))
            const sectionTotal = selectedSectionItems.reduce((sum, item) => sum + getItemTotal(item), 0)
            if (sectionTotal > 0) {
              actItemsToSave.push({ sectionId: section.id, name: section.name, unit: '-', quantity: 1, price: sectionTotal, total: sectionTotal })
              selectedSectionItems.forEach(item => {
                actItemsToSave.push({ itemId: item.id, sectionId: section.id, name: item.name, unit: item.unit || '-', quantity: item.quantity, price: getItemPrice(item), total: getItemTotal(item) })
              })
            }
          })
        } else {
          sections.forEach(section => {
            section.items.forEach(item => {
              if (!selectedItems.has(item.id)) return
              actItemsToSave.push({ itemId: item.id, sectionId: section.id, name: item.name, unit: item.unit || '-', quantity: item.quantity, price: getItemPrice(item), total: getItemTotal(item) })
            })
          })
        }
        await projectsApi.saveAct(projectId, {
          viewId: selectedViewId, actNumber, actDate, executorName, executorDetails,
          customerName, directorName, serviceName, selectionMode, grandTotal, items: actItemsToSave,
        })
        await loadUsedItems()
      } catch (saveErr) {
        console.error('Act save error:', saveErr)
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Ошибка при создании PDF. Попробуйте ещё раз.')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasSelection = actLines.length > 0
  const canPreview = actNumber.trim() && customerName.trim() && executorName.trim() && hasSelection

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
            <IconBack className="w-4 h-4" />
            Назад к актам
          </button>
          <h1 className="font-display text-2xl font-bold text-white">
            {step === 'config' ? 'Создание акта выполненных работ' : 'Предпросмотр акта'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('config')} className="btn-secondary flex items-center gap-2">
                <IconBack className="w-5 h-5" />
                Назад к настройке
              </button>
              <button onClick={handleDownload} disabled={isGenerating} className="btn-primary flex items-center gap-2">
                <IconDownload className="w-4 h-4" />
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
                    <IconEye className="w-3.5 h-3.5" />
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
                <p className="text-xs text-slate-500 mt-2">Выберите, цены из какого представления использовать для расчёта акта</p>
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
                          <img src={images[type]} alt={IMAGE_LABELS[type]} className="max-h-20 max-w-full object-contain" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openFileDialog(type)} disabled={uploadingImage === type} className="flex-1 text-xs px-3 py-1.5 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">Заменить</button>
                          <button onClick={() => handleImageDelete(type)} className="text-xs px-3 py-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">Удалить</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => openFileDialog(type)} disabled={uploadingImage === type} className="w-full border-2 border-dashed border-slate-600 rounded-lg py-6 flex flex-col items-center gap-2 hover:border-primary-500/50 hover:bg-slate-700/30 transition-all cursor-pointer">
                        {uploadingImage === type ? <Spinner size="sm" /> : (
                          <>
                            <IconPlus className="w-6 h-6 text-slate-500" />
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
                <input type="text" value={actNumber} onChange={e => setActNumber(e.target.value)} placeholder="170" className="input-field" />
              </div>
              <div>
                <label className="label">Дата акта</label>
                <input type="date" value={actDate} onChange={e => setActDate(e.target.value)} className="input-field" />
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
                <input type="text" value={executorName} onChange={e => setExecutorName(e.target.value)} placeholder="ИП Чурина Елизавета Алексеевна" className="input-field" />
              </div>
              <div>
                <label className="label">Реквизиты (ИНН, адрес и т.д.)</label>
                <textarea value={executorDetails} onChange={e => setExecutorDetails(e.target.value)} placeholder="ИНН 665404395460, 623640, Россия, Свердловская обл, Талицкий р-н, г Талица, ул Кузнецова, д 62, кв 2" className="input-field min-h-[80px]" rows={2} />
              </div>
              <div className="border-t border-slate-700/50 pt-4">
                <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded bg-accent-500/20 flex items-center justify-center text-accent-400 text-xs font-bold">З</div>
                  Заказчик
                </h3>
                <div>
                  <label className="label">ФИО заказчика *</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Шаповалова Елена Владимировна" className="input-field" />
                </div>
              </div>
              <div className="border-t border-slate-700/50 pt-4">
                <h3 className="font-semibold text-white mb-4">Подпись</h3>
                <div>
                  <label className="label">ФИО директора (для подписи)</label>
                  <input type="text" value={directorName} onChange={e => setDirectorName(e.target.value)} placeholder="Чурина Е.А." className="input-field" />
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
                {(['sections', 'items'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSelectionMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectionMode === mode
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                    }`}
                  >
                    {mode === 'sections' ? 'По разделам' : 'По позициям'}
                  </button>
                ))}
              </div>

              {/* Sections / Items checkboxes */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sections.map(section => {
                  const usedInSectionCount = section.items.filter(i => usedItems[i.id]?.length > 0).length
                  return (
                    <div key={section.id} className="bg-slate-700/20 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => toggleSection(section.id)}>
                        <input type="checkbox" checked={selectedSections.has(section.id)} onChange={() => toggleSection(section.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500" />
                        <span className="font-medium text-white text-sm flex-1">{section.name}</span>
                        <div className="flex items-center gap-2">
                          {usedInSectionCount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30" title={`${usedInSectionCount} из ${section.items.length} поз. уже были в актах`}>
                              {usedInSectionCount} в актах
                            </span>
                          )}
                          <span className="text-xs text-slate-400">{section.items.filter(i => selectedItems.has(i.id)).length} / {section.items.length} поз.</span>
                        </div>
                      </div>
                      {selectionMode === 'items' && (
                        <div className="px-4 py-2 space-y-1">
                          {section.items.map(item => {
                            const itemUsage = usedItems[item.id]
                            const isUsed = itemUsage && itemUsage.length > 0
                            return (
                              <div key={item.id} className={`flex items-center gap-3 px-3 py-1.5 rounded hover:bg-slate-700/30 cursor-pointer transition-colors ${isUsed ? 'bg-amber-500/5' : ''}`} onClick={() => toggleItem(section.id, item.id)}>
                                <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleItem(section.id, item.id)} onClick={e => e.stopPropagation()} className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500" />
                                <span className={`text-sm flex-1 ${isUsed ? 'text-amber-200' : 'text-slate-300'}`}>{item.name}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {isUsed && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap" title={itemUsage.map(u => `Акт №${u.actNumber} от ${u.actDate}`).join('\n')}>
                                      Акт {itemUsage.map(u => `№${u.actNumber}`).join(', ')}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-500">{formatMoney(getItemTotal(item))} ₽</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary */}
            {hasSelection && (
              <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    Итого в акте: <strong className="text-white">{actLines.length}</strong> {selectionMode === 'sections' ? 'разделов' : 'позиций'}
                  </span>
                  <span className="font-display font-bold text-primary-400 text-lg">{formatMoney(grandTotal)} ₽</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Preview Step */
          <div>
            <div className="bg-white rounded-xl shadow-lg overflow-auto mx-auto" style={{ maxWidth: '850px' }}>
              <ActDocumentTemplate
                ref={actRef}
                actNumber={actNumber}
                actDate={actDate}
                executorName={executorName}
                executorDetails={executorDetails}
                customerName={customerName}
                directorName={directorName}
                actLines={actLines}
                grandTotal={grandTotal}
                images={images}
              />
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
            <IconEye className="w-5 h-5" />
            Предпросмотр
          </button>
        </div>
      )}
    </div>
  )
}

