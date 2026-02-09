import { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement>, ThHTMLAttributes<HTMLTableCellElement> {
  /** Cell content */
  children: ReactNode
  /** Whether cell is a header cell */
  header?: boolean
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Whether cell should have compact padding */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Table cell component with consistent styling
 * 
 * @example
 * ```tsx
 * <TableCell header align="right">Price</TableCell>
 * <TableCell align="right" compact>100</TableCell>
 * ```
 */
export default function TableCell({
  children,
  header = false,
  align = 'left',
  compact = false,
  className = '',
  ...props
}: TableCellProps) {
  const Component = header ? 'th' : 'td'
  
  const paddingClasses = compact
    ? 'px-1.5 sm:px-4 py-1.5 sm:py-3'
    : 'px-4 py-3'
  
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }
  
  const textColorClasses = header
    ? 'text-slate-400 font-medium'
    : 'text-slate-200'
  
  return (
    <Component
      className={`${paddingClasses} ${alignClasses[align]} ${textColorClasses} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

