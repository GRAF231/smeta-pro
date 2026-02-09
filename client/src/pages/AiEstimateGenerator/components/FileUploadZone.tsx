import type { RefObject } from 'react'

interface FileUploadZoneProps {
  pdfFile: File | null
  isDragOver: boolean
  isLoading: boolean
  fileInputRef: RefObject<HTMLInputElement>
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}

/**
 * File upload zone component for PDF upload
 * 
 * Supports drag & drop and file input selection
 */
export default function FileUploadZone({
  pdfFile,
  isDragOver,
  isLoading,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemove,
}: FileUploadZoneProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' Б'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ'
  }

  return (
    <div>
      <label className="label">PDF дизайн-проект</label>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={onFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      {!pdfFile ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${isDragOver 
              ? 'border-purple-400 bg-purple-500/10' 
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
            }
          `}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm text-slate-300 mb-1">
            Перетащите PDF файл сюда или нажмите для выбора
          </p>
          <p className="text-xs text-slate-500">
            Максимальный размер: 100 МБ
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{pdfFile.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(pdfFile.size)}</p>
          </div>
          {!isLoading && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

