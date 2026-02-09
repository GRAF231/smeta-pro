interface ErrorAlertProps {
  message: string
  onClose?: () => void
  className?: string
}

export default function ErrorAlert({ message, onClose, className = '' }: ErrorAlertProps) {
  if (!message) return null

  return (
    <div className={`mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm ${className}`}>
      {message}
      {onClose && (
        <button onClick={onClose} className="ml-4 text-red-300 hover:text-red-200">✕</button>
      )}
    </div>
  )
}

