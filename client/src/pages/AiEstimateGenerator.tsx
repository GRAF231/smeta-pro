import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFileUpload } from './AiEstimateGenerator/hooks/useFileUpload'
import { useFormState } from '../hooks/forms/useFormState'
import { usePdfGeneration } from './AiEstimateGenerator/hooks/usePdfGeneration'
import FileUploadZone from './AiEstimateGenerator/components/FileUploadZone'
import ProgressIndicator from './AiEstimateGenerator/components/ProgressIndicator'
import Input from '../components/ui/Input'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'

/**
 * AI Estimate Generator page component
 * 
 * Allows users to upload a PDF design project and generate an estimate using AI
 */
export default function AiEstimateGenerator() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  
  const fileUpload = useFileUpload()
  const formState = useFormState({
    title: '',
    pricelistUrl: '',
    comments: '',
  })
  const { isLoading, progress, handleSubmit } = usePdfGeneration(
    fileUpload.pdfFile,
    formState.values.title,
    formState.values.pricelistUrl,
    formState.values.comments,
    (err: string) => {
      setError(err)
      fileUpload.setError(err)
    }
  )

  const handleFormSubmit = async (e: React.FormEvent) => {
    setError('')
    fileUpload.setError('')
    await handleSubmit(e)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Генерация сметы через ИИ
            </h1>
            <p className="text-sm text-slate-400">
              Загрузите дизайн-проект в PDF и получите готовую смету
            </p>
          </div>
        </div>

        {(error || fileUpload.error) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error || fileUpload.error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormField label="Название сметы" required htmlFor="title">
            <Input
              id="title"
              type="text"
              value={formState.values.title}
              onChange={(e) => formState.setValue('title', e.target.value)}
              placeholder="Например: Ремонт квартиры ул. Ленина 15"
              required
              disabled={isLoading}
            />
          </FormField>

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

          <FormField
            label="Ссылка на прайс-лист (Google Таблица)"
            required
            htmlFor="pricelistUrl"
            hint="Таблица с ценами на работы. Формат произвольный — ИИ сам определит структуру."
          >
            <Input
              id="pricelistUrl"
              type="url"
              value={formState.values.pricelistUrl}
              onChange={(e) => formState.setValue('pricelistUrl', e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              required
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Уточняющие комментарии (необязательно)"
            htmlFor="comments"
          >
            <textarea
              id="comments"
              value={formState.values.comments}
              onChange={(e) => formState.setValue('comments', e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="Например: квартира 60 кв.м., 2 комнаты, бюджет средний, нужна полная замена электрики..."
              disabled={isLoading}
            />
          </FormField>

          {/* Info block */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Как это работает
            </h3>
            <div className="text-sm space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-medium mt-0.5">1.</span>
                <span>ИИ извлекает информацию о помещениях и работах из дизайн-проекта</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-medium mt-0.5">2.</span>
                <span>Сопоставляет необходимые работы с позициями из вашего прайс-листа</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-medium mt-0.5">3.</span>
                <span>Оценивает объёмы и формирует смету по разделам</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-medium mt-0.5">4.</span>
                <span>Вы можете отредактировать результат в редакторе смет</span>
              </div>
            </div>
          </div>

          <ProgressIndicator progress={progress} />

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => navigate('/dashboard')}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={!fileUpload.pdfFile}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            >
              Сгенерировать смету
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

