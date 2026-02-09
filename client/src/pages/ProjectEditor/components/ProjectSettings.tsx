import type { ProjectWithEstimate } from '../../../types'
import { IconExternalLink } from '../../../components/ui/Icons'

interface ProjectSettingsProps {
  project: ProjectWithEstimate
  onDelete: () => void
}

/**
 * Component for displaying project settings and danger zone
 * 
 * Shows:
 * - Google Sheet connection info (if connected)
 * - Danger zone with delete project button
 */
export function ProjectSettings({ project, onDelete }: ProjectSettingsProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {project.googleSheetId && (
        <div className="card">
          <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Google Таблица
          </h2>
          <p className="text-xs text-slate-500 mb-3 break-all">ID: {project.googleSheetId}</p>
          <a
            href={`https://docs.google.com/spreadsheets/d/${project.googleSheetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            Открыть таблицу
            <IconExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <div className={`card border-red-500/20 ${!project.googleSheetId ? 'sm:col-span-2' : ''}`}>
        <h2 className="font-semibold text-red-400 mb-2">Опасная зона</h2>
        <p className="text-xs text-slate-500 mb-3">
          Удаление проекта невозможно отменить. Все данные будут потеряны.
        </p>
        <button
          onClick={onDelete}
          className="px-4 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
        >
          Удалить проект
        </button>
      </div>
    </div>
  )
}

