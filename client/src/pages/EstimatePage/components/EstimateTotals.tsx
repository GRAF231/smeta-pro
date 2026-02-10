/**
 * EstimatePage totals component
 * 
 * Displays totals for the active view.
 */

import type { EstimateView } from '../../../types'
import { formatNumber } from '../../../utils/format'

interface EstimateTotalsProps {
  activeView: EstimateView | null
  total: number
}

/**
 * EstimatePage totals component
 * 
 * @param props - Totals props
 * @returns Totals JSX
 */
export default function EstimateTotals({ activeView, total }: EstimateTotalsProps) {
  if (!activeView) return null

  return (
    <div className="card bg-gradient-to-r from-primary-500/20 to-primary-600/10 border-primary-500/30 mb-8">
      <p className="text-sm text-slate-400 mb-1">Итого: {activeView.name}</p>
      <p className="font-display text-2xl font-bold text-primary-400">{formatNumber(total)} ₽</p>
    </div>
  )
}



