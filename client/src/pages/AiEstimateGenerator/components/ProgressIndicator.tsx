interface ProgressIndicatorProps {
  progress: string
}

/**
 * Progress indicator component for PDF generation
 */
export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  if (!progress) return null

  return (
    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/30"></div>
          <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin"></div>
        </div>
        <div>
          <p className="text-sm font-medium text-purple-300">{progress}</p>
          <p className="text-xs text-purple-400/70 mt-0.5">Это может занять до 2-5 минут для больших документов</p>
        </div>
      </div>
    </div>
  )
}

