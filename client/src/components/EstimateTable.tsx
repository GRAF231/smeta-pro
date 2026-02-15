import { useState, useRef, useCallback, TouchEvent } from 'react'
import type { EstimateData } from '../types'
import { formatNumber } from '../utils/format'
import Table from './tables/Table'
import TableRow from './tables/TableRow'
import TableCell from './tables/TableCell'

/**
 * Props for EstimateTable component
 */
interface EstimateTableProps {
  /** Estimate data to display */
  data: EstimateData
  /** Name of the view (displayed in section headers) */
  viewName?: string
  /** @deprecated use viewName instead */
  variant?: 'customer' | 'master'
}

/**
 * Zoom state for pinch-to-zoom functionality
 */
interface ZoomState {
  scale: number
  initialDistance: number | null
  baseScale: number
}

/**
 * Props for PinchZoomSection component
 */
interface PinchZoomSectionProps {
  /** Section content (table) */
  children: React.ReactNode
  /** Section name */
  sectionName: string
  /** Section index for animation delay */
  sectionIdx: number
}

/**
 * Section wrapper with pinch-to-zoom functionality
 * 
 * Provides touch gesture support for zooming table content on mobile devices.
 * Includes reset button when zoomed in.
 * 
 * @example
 * ```tsx
 * <PinchZoomSection sectionName="Раздел 1" sectionIdx={0}>
 *   <Table>...</Table>
 * </PinchZoomSection>
 * ```
 */
function PinchZoomSection({ children, sectionName, sectionIdx }: PinchZoomSectionProps) {
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, initialDistance: null, baseScale: 1 })
  const containerRef = useRef<HTMLDivElement>(null)

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches)
      setZoom(prev => ({ ...prev, initialDistance: dist, baseScale: prev.scale }))
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && zoom.initialDistance !== null) {
      e.preventDefault()
      const dist = getDistance(e.touches)
      const newScale = Math.min(Math.max(zoom.baseScale * (dist / zoom.initialDistance), 0.5), 3)
      setZoom(prev => ({ ...prev, scale: newScale }))
    }
  }, [zoom.initialDistance, zoom.baseScale])

  const handleTouchEnd = useCallback(() => {
    setZoom(prev => ({ ...prev, initialDistance: null }))
  }, [])

  const resetZoom = () => {
    setZoom({ scale: 1, initialDistance: null, baseScale: 1 })
  }

  return (
    <div
      className="card animate-fade-in overflow-hidden !p-0 sm:!p-0"
      style={{ animationDelay: `${sectionIdx * 50}ms` }}
    >
      {/* Section header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary-500/10 to-primary-600/5 border-b border-primary-500/20 flex items-center justify-between">
        <h2 className="font-display font-semibold text-base sm:text-lg text-white">
          {sectionName}
        </h2>
        {zoom.scale !== 1 && (
          <button
            onClick={resetZoom}
            className="text-xs text-slate-400 hover:text-white bg-slate-700/50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            {Math.round(zoom.scale * 100)}%
          </button>
        )}
      </div>

      {/* Zoomable table area */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="overflow-x-auto overflow-y-hidden"
        style={{ touchAction: zoom.initialDistance !== null ? 'none' : 'pan-x pan-y' }}
      >
        <div
          style={{
            transform: `scale(${zoom.scale})`,
            transformOrigin: 'top left',
            width: zoom.scale !== 1 ? `${100 / zoom.scale}%` : '100%',
          }}
          className="transition-transform duration-75"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Estimate table component for displaying estimate data
 * 
 * Renders a formatted table with sections, items, and totals.
 * Supports pinch-to-zoom on mobile devices for better readability.
 * Displays grand total at the bottom.
 * 
 * @example
 * ```tsx
 * <EstimateTable
 *   data={estimateData}
 *   viewName="Для заказчика"
 * />
 * ```
 */
export default function EstimateTable({ data, viewName, variant }: EstimateTableProps) {
  // Use viewName if available, fallback to variant-based label
  const label = viewName || (variant === 'master' ? 'Для мастеров' : 'Для заказчика')
  void label // used in print header if needed

  return (
    <div className="space-y-4 sm:space-y-6">
      {data.sections.map((section, sectionIdx) => (
        <PinchZoomSection
          key={section.name}
          sectionName={section.name}
          sectionIdx={sectionIdx}
        >
          <Table>
            <thead>
              <TableRow header>
                <TableCell header compact className="w-8 sm:w-12">№</TableCell>
                <TableCell header compact>Наименование работ</TableCell>
                <TableCell header align="center" compact className="w-12 sm:w-20">Ед.</TableCell>
                <TableCell header align="right" compact className="w-12 sm:w-24">Кол-во</TableCell>
                <TableCell header align="right" compact className="w-16 sm:w-28">Цена</TableCell>
                <TableCell header align="right" compact className="w-18 sm:w-32">Сумма</TableCell>
              </TableRow>
            </thead>
            <tbody>
              {section.items.map((item, idx) => {
                const isPaid = item.paidAmount > 0
                const isCompleted = item.completedAmount > 0
                return (
                  <TableRow key={idx} hoverable>
                    <TableCell compact className="text-slate-500">{item.number}</TableCell>
                    <TableCell compact className="text-slate-200 leading-tight">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{item.name}</span>
                        {isPaid && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            Оплачено
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Выполнено
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="center" compact className="text-slate-400">{item.unit}</TableCell>
                    <TableCell align="right" compact className="text-slate-300">{item.quantity}</TableCell>
                    <TableCell align="right" compact className="text-slate-300 whitespace-nowrap">{formatNumber(item.price)}</TableCell>
                    <TableCell align="right" compact className="font-medium text-white whitespace-nowrap">
                      {formatNumber(item.total)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </tbody>
            <tfoot>
              <TableRow highlighted>
                <TableCell colSpan={5} align="right" compact className="font-semibold text-slate-300 text-xs sm:text-sm">
                  Итого по разделу:
                </TableCell>
                <TableCell align="right" compact className="font-bold text-sm sm:text-lg whitespace-nowrap text-primary-400">
                  {formatNumber(section.subtotal)} ₽
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </PinchZoomSection>
      ))}

      {/* Grand total */}
      <div className="card animate-fade-in bg-gradient-to-r from-primary-500/20 to-primary-600/10 border-primary-500/30">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs sm:text-sm mb-1">Итого стоимость работ</p>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {formatNumber(data.total)} ₽
            </h3>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-primary-500/20">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
