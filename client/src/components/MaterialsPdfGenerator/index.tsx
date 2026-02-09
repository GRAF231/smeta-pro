import { useState, useRef, useEffect, useCallback } from 'react'
import { projectsApi } from '../../services/api'
import { useErrorHandler } from '../../hooks/useErrorHandler'
import type { Material, ProjectId } from '../../types'
import { STORAGE_KEYS } from '../../constants/storage'
import { renderToPdf } from '../../utils/pdfGenerator'
import { IconBack, IconDownload, IconEye, IconClose } from '../ui/Icons'
import KpConfigStep from './KpConfigStep'
import KpDocumentTemplate from './KpDocumentTemplate'

interface MaterialsPdfGeneratorProps {
  projectId: ProjectId
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
  const { handleError } = useErrorHandler()
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
      const saved = localStorage.getItem(STORAGE_KEYS.KP_CONFIG(projectId))
      if (saved) {
        const config = JSON.parse(saved)
        if (config.executorName) setExecutorName(config.executorName)
        if (config.executorDetails) setExecutorDetails(config.executorDetails)
        if (config.validDays) setValidDays(config.validDays)
      }
      // Also try act-config for executor info
      const actSaved = localStorage.getItem(STORAGE_KEYS.ACT_CONFIG(projectId))
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
    localStorage.setItem(STORAGE_KEYS.KP_CONFIG(projectId), JSON.stringify({
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
      handleError(err, 'Ошибка при создании PDF. Попробуйте ещё раз.')
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
            <KpConfigStep
              kpNumber={kpNumber}
              kpDate={kpDate}
              executorName={executorName}
              executorDetails={executorDetails}
              validDays={validDays}
              materialsCount={materials.length}
              grandTotal={grandTotal}
              onKpNumberChange={setKpNumber}
              onKpDateChange={setKpDate}
              onExecutorNameChange={setExecutorName}
              onExecutorDetailsChange={setExecutorDetails}
              onValidDaysChange={setValidDays}
            />
          ) : (
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-lg overflow-auto mx-auto" style={{ maxWidth: '850px' }}>
                <div ref={docRef}>
                  <KpDocumentTemplate
                    kpNumber={kpNumber}
                    kpDate={kpDate}
                    executorName={executorName}
                    executorDetails={executorDetails}
                    validDays={validDays}
                    materials={materials}
                    grandTotal={grandTotal}
                    images={images}
                  />
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

