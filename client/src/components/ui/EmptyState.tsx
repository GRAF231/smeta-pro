import { ReactNode } from 'react'

export interface EmptyStateProps {
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Icon to display */
  icon?: ReactNode
  /** Action button or element */
  action?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Component for displaying empty states
 * 
 * Used to show empty or no-data states in lists, tables, or other content areas.
 * Provides a consistent way to communicate empty states to users with:
 * - Title and optional description
 * - Optional icon for visual context
 * - Optional action button or element
 * 
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState
 *   title="No items found"
 *   description="Try adjusting your filters"
 * />
 * 
 * // With icon and action
 * <EmptyState
 *   title="No projects yet"
 *   description="Create your first project to get started"
 *   icon={<IconDocument className="w-16 h-16" />}
 *   action={<Button onClick={handleCreate}>Create Project</Button>}
 * />
 * ```
 */
export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}

