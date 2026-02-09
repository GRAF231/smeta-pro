import { ReactNode, HTMLAttributes } from 'react'

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Table content */
  children: ReactNode
  /** Whether table has compact spacing */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Base table component with consistent styling
 * 
 * @example
 * ```tsx
 * <Table>
 *   <thead>
 *     <TableRow>
 *       <TableCell>Header 1</TableCell>
 *     </TableRow>
 *   </thead>
 *   <tbody>
 *     <TableRow>
 *       <TableCell>Data 1</TableCell>
 *     </TableRow>
 *   </tbody>
 * </Table>
 * ```
 */
export default function Table({
  children,
  compact = false,
  className = '',
  ...props
}: TableProps) {
  const spacingClass = compact ? 'text-xs' : 'text-xs sm:text-sm'
  
  return (
    <table
      className={`w-full ${spacingClass} ${className}`}
      {...props}
    >
      {children}
    </table>
  )
}

