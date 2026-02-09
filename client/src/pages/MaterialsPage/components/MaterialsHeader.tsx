/**
 * MaterialsPage header component
 * 
 * Displays project title and material count.
 */

import BackButton from '../../../components/ui/BackButton'
import type { Project } from '../../../types'

interface MaterialsHeaderProps {
  projectId: string
  project: Project
  materialsCount: number
}

/**
 * MaterialsPage header component
 * 
 * @param props - Header props
 * @returns Header JSX
 */
export default function MaterialsHeader({ projectId, project, materialsCount }: MaterialsHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
      <div>
        <BackButton to={`/projects/${projectId}/edit`} label="Назад к проекту" />
        <h1 className="font-display text-2xl font-bold text-white">Материалы: {project.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{materialsCount} позиций</p>
      </div>
    </div>
  )
}


