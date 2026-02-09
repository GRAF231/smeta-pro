import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi } from '../../../services/api'

/**
 * Hook for PDF generation logic (submit, progress)
 * 
 * @param pdfFile - Selected PDF file
 * @param title - Project title
 * @param pricelistUrl - Google Sheets URL
 * @param comments - Additional comments
 * @param setError - Function to set error message
 * @returns Object containing:
 * - `isLoading` - Loading state flag
 * - `progress` - Progress message
 * - `handleSubmit` - Function to submit form
 */
export function usePdfGeneration(
  pdfFile: File | null,
  title: string,
  pricelistUrl: string,
  comments: string,
  setError: (error: string) => void
) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!pdfFile) {
      setError('Загрузите PDF файл с дизайн-проектом')
      return
    }

    if (!title.trim()) {
      setError('Укажите название сметы')
      return
    }

    if (!pricelistUrl.trim()) {
      setError('Укажите ссылку на прайс-лист')
      return
    }

    setIsLoading(true)
    setProgress('Загрузка PDF и конвертация страниц в изображения...')

    try {
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      formData.append('title', title.trim())
      formData.append('pricelistUrl', pricelistUrl.trim())
      formData.append('comments', comments.trim())

      // Update progress after a delay (server processes PDF first, then sends to AI)
      setTimeout(() => setProgress('ИИ анализирует изображения дизайн-проекта...'), 5000)
      setTimeout(() => setProgress('ИИ составляет смету на основе прайс-листа...'), 30000)
      setTimeout(() => setProgress('Почти готово, финализация сметы...'), 90000)

      const res = await projectsApi.generateFromPdf(formData)
      
      // Redirect to project editor
      navigate(`/projects/${res.data.id}/edit`)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Ошибка генерации сметы. Попробуйте снова.')
    } finally {
      setIsLoading(false)
      setProgress('')
    }
  }

  return {
    isLoading,
    progress,
    handleSubmit,
  }
}

