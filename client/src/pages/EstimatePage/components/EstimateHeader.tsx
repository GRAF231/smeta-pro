/**
 * EstimatePage header component
 * 
 * Displays project title, sync status, and navigation buttons.
 */

import { useNavigate } from 'react-router-dom'
import type { ProjectWithEstimate } from '../../../types'
import BackButton from '../../../components/ui/BackButton'
import { IconDocument, IconClock, IconSync } from '../../../components/ui/Icons'

interface EstimateHeaderProps {
  projectId: string
  project: ProjectWithEstimate
  isSyncing: boolean
  onSync: () => void
  onVersionsClick: () => void
}

/**
 * EstimatePage header component
 * 
 * @param props - Header props
 * @returns Header JSX
 */
export default function EstimateHeader({
  projectId,
  project,
  isSyncing,
  onSync,
  onVersionsClick,
}: EstimateHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
      <div>
        <BackButton to={`/projects/${projectId}/edit`} label="Назад к проекту" />
        <h1 className="font-display text-2xl font-bold text-white">{project.title}</h1>
        {project.lastSyncedAt && (
          <p className="text-sm text-slate-500 mt-1">
            Синхронизировано: {new Date(project.lastSyncedAt).toLocaleString('ru-RU')}
          </p>
        )}
      </div>
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => navigate(`/projects/${projectId}/acts`)} className="btn-secondary flex items-center gap-2">
          <IconDocument className="w-5 h-5" />
          Акты
        </button>
        <button onClick={onVersionsClick} className="btn-secondary flex items-center gap-2">
          <IconClock className="w-5 h-5" />
          Версии
        </button>
        {project.googleSheetId && (
          <button onClick={onSync} disabled={isSyncing} className="btn-secondary flex items-center gap-2">
            <IconSync className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Синхронизация...' : 'Обновить из таблицы'}
          </button>
        )}
      </div>
    </div>
  )
}


