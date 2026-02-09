import { useState, useRef, useCallback } from 'react'

/**
 * Hook for file upload logic (drag & drop, validation)
 * 
 * @returns Object containing:
 * - `pdfFile` - Selected PDF file (null if none)
 * - `isDragOver` - Whether drag is over the drop zone
 * - `fileInputRef` - Ref for file input element
 * - `error` - File validation error message
 * - `handleDragOver` - Handler for drag over event
 * - `handleDragLeave` - Handler for drag leave event
 * - `handleDrop` - Handler for drop event
 * - `handleFileSelect` - Handler for file input change
 * - `removePdf` - Function to remove selected file
 * - `setError` - Function to set error message
 */
export function useFileUpload() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setError('')
    } else {
      setError('Допускаются только PDF файлы')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile(file)
        setError('')
      } else {
        setError('Допускаются только PDF файлы')
      }
    }
  }, [])

  const removePdf = useCallback(() => {
    setPdfFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return {
    pdfFile,
    isDragOver,
    fileInputRef,
    error,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    removePdf,
    setError,
  }
}

