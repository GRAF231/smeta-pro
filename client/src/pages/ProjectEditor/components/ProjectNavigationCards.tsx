import { Link } from 'react-router-dom'
import type { ProjectId } from '../../../types'
import { IconCalculator, IconBox, IconDocument } from '../../../components/ui/Icons'

interface ProjectNavigationCardsProps {
  projectId: ProjectId
}

/**
 * Component for displaying navigation cards to different project pages
 * 
 * Shows three navigation cards:
 * - Estimate page (Смета)
 * - Materials page (Материалы)
 * - Acts page (Акты работ)
 */
export function ProjectNavigationCards({ projectId }: ProjectNavigationCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      <Link
        to={`/projects/${projectId}/estimate`}
        className="card group hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
            <IconCalculator className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">Смета</h3>
            <p className="text-xs text-slate-500">Разделы и позиции работ</p>
          </div>
        </div>
        <span className="text-sm text-slate-400">Открыть →</span>
      </Link>

      <Link
        to={`/projects/${projectId}/materials`}
        className="card group hover:border-accent-500/50 transition-all hover:shadow-lg hover:shadow-accent-500/5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center group-hover:bg-accent-500/30 transition-colors">
            <IconBox className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-accent-300 transition-colors">Материалы</h3>
            <p className="text-xs text-slate-500">Список материалов и цены</p>
          </div>
        </div>
        <span className="text-sm text-slate-400">Открыть →</span>
      </Link>

      <Link
        to={`/projects/${projectId}/acts`}
        className="card group hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
            <IconDocument className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">Акты работ</h3>
            <p className="text-xs text-slate-500">История и создание актов</p>
          </div>
        </div>
        <span className="text-sm text-slate-400">Открыть →</span>
      </Link>
    </div>
  )
}

