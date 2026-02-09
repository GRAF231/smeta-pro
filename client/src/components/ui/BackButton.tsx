import { useNavigate } from 'react-router-dom'
import { IconBack } from './Icons'

interface BackButtonProps {
  to: string
  label: string
  className?: string
}

export default function BackButton({ to, label, className = '' }: BackButtonProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(to)}
      className={`text-slate-400 hover:text-white mb-2 flex items-center gap-1 ${className}`}
    >
      <IconBack className="w-4 h-4" />
      {label}
    </button>
  )
}

