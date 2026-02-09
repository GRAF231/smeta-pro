import { ReactNode, HTMLAttributes } from 'react'

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Row content */
  children: ReactNode
  /** Whether row is a header row */
  header?: boolean
  /** Whether row should have hover effect */
  hoverable?: boolean
  /** Whether row is highlighted */
  highlighted?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Table row component with consistent styling
 * 
 * @example
 * ```tsx
 * <TableRow header>
 *   <TableCell>Header</TableCell>
 * </TableRow>
 * 
 * <TableRow hoverable>
 *   <TableCell>Data</TableCell>
 * </TableRow>
 * ```
 */
export default function TableRow({
  children,
  header = false,
  hoverable = false,
  highlighted = false,
  className = '',
  ...props
}: TableRowProps) {
  const baseClasses = header
    ? 'text-left text-slate-400 border-b border-slate-700/50'
    : 'border-b border-slate-700/30'
  
  const interactiveClasses = hoverable ? 'hover:bg-slate-700/20 transition-colors' : ''
  const highlightClasses = highlighted ? 'bg-primary-500/10' : ''
  
  return (
    <tr
      className={`${baseClasses} ${interactiveClasses} ${highlightClasses} ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

