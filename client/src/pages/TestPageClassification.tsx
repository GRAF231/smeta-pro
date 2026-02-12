import { useState } from 'react'
import { projectsApi } from '../services/api'
import FileUploadZone from './AiEstimateGenerator/components/FileUploadZone'
import { useFileUpload } from './AiEstimateGenerator/hooks/useFileUpload'
import Button from '../components/ui/Button'

interface ClassificationResult {
  taskId: string
  totalPages: number
  classifications: Array<{
    pageNumber: number
    pageType: 'plan' | 'wall_layout' | 'specification' | 'visualization' | 'other'
    roomName: string | null
  }>
  savedClassifications: Array<{
    id: string
    task_id: string
    page_number: number
    page_type: string
    room_name: string | null
    image_data_url: string | null
    created_at: string
  }>
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  plan: 'План помещения',
  wall_layout: 'Развертка стен',
  specification: 'Спецификация',
  visualization: 'Визуализация',
  other: 'Прочее',
}

const PAGE_TYPE_COLORS: Record<string, string> = {
  plan: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  wall_layout: 'bg-green-500/20 text-green-400 border-green-500/30',
  specification: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  visualization: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

/**
 * Страница для тестирования классификации страниц PDF
 */
export default function TestPageClassification() {
  const fileUpload = useFileUpload()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ClassificationResult | null>(null)

  const handleTest = async () => {
    if (!fileUpload.pdfFile) {
      setError('Загрузите PDF файл')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('pdf', fileUpload.pdfFile)

      const response = await projectsApi.testPageClassification(formData)
      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка классификации страниц')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Тестирование классификации страниц
            </h1>
            <p className="text-sm text-slate-400">
              Загрузите PDF дизайн-проект для тестирования классификации страниц
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <FileUploadZone
            pdfFile={fileUpload.pdfFile}
            isDragOver={fileUpload.isDragOver}
            isLoading={isLoading}
            fileInputRef={fileUpload.fileInputRef}
            onDragOver={fileUpload.handleDragOver}
            onDragLeave={fileUpload.handleDragLeave}
            onDrop={fileUpload.handleDrop}
            onFileSelect={fileUpload.handleFileSelect}
            onRemove={fileUpload.removePdf}
          />

          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleTest}
            loading={isLoading}
            disabled={!fileUpload.pdfFile}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Классифицировать страницы
          </Button>

          {result && (
            <div className="mt-8 space-y-4">
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h3 className="font-medium text-white mb-2">
                  Результаты классификации
                </h3>
                <div className="text-sm text-slate-400">
                  Всего страниц: <span className="text-white font-medium">{result.totalPages}</span>
                </div>
                <div className="text-sm text-slate-400">
                  Task ID: <span className="text-white font-mono text-xs">{result.taskId}</span>
                </div>
              </div>

              <div className="space-y-3">
                {result.classifications.map((classification, index) => {
                  const saved = result.savedClassifications[index]
                  return (
                    <div
                      key={index}
                      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-medium">
                              Страница {classification.pageNumber}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium border ${PAGE_TYPE_COLORS[classification.pageType] || PAGE_TYPE_COLORS.other}`}
                            >
                              {PAGE_TYPE_LABELS[classification.pageType] || 'Прочее'}
                            </span>
                            {classification.roomName && (
                              <span className="px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                {classification.roomName}
                              </span>
                            )}
                          </div>
                          {saved?.image_data_url && (
                            <div className="mt-3">
                              <img
                                src={saved.image_data_url}
                                alt={`Page ${classification.pageNumber}`}
                                className="max-w-full h-auto rounded-lg border border-slate-700/50"
                                style={{ maxHeight: '300px' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Statistics */}
              <div className="bg-slate-700/30 rounded-xl p-4 mt-6">
                <h3 className="font-medium text-white mb-3">Статистика</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(PAGE_TYPE_LABELS).map(([type, label]) => {
                    const count = result.classifications.filter(
                      (c) => c.pageType === type
                    ).length
                    return (
                      <div key={type} className="text-center">
                        <div className="text-2xl font-bold text-white">{count}</div>
                        <div className="text-xs text-slate-400">{label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

