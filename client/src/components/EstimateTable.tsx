import { useState, useRef, useCallback, TouchEvent } from 'react'
import { EstimateData } from '../services/api'

interface EstimateTableProps {
  data: EstimateData
  variant: 'customer' | 'master'
}

interface ZoomState {
  scale: number
  initialDistance: number | null
  baseScale: number
}

function PinchZoomSection({ children, sectionName, variant, sectionIdx }: {
  children: React.ReactNode
  sectionName: string
  variant: 'customer' | 'master'
  sectionIdx: number
}) {
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
      <div className={`px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r flex items-center justify-between ${
        variant === 'customer'
          ? 'from-primary-500/10 to-primary-600/5 border-b border-primary-500/20'
          : 'from-accent-500/10 to-accent-600/5 border-b border-accent-500/20'
      }`}>
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

export default function EstimateTable({ data, variant }: EstimateTableProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {data.sections.map((section, sectionIdx) => (
        <PinchZoomSection
          key={section.name}
          sectionName={section.name}
          variant={variant}
          sectionIdx={sectionIdx}
        >
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700/50">
                <th className="px-1.5 sm:px-4 py-1.5 sm:py-3 font-medium w-8 sm:w-12">№</th>
                <th className="px-1.5 sm:px-4 py-1.5 sm:py-3 font-medium">Наименование работ</th>
                <th className="px-1.5 sm:px-4 py-1.5 sm:py-3 font-medium text-center w-12 sm:w-20">Ед.</th>
                <th className="px-1.5 sm:px-4 py-1.5 sm:py-3 font-medium text-right w-12 sm:w-24">Кол-во</th>
                <th className="px-1.5 sm:px-4 py-1.5 sm:py-3 font-medium text-right w-16 sm:w-28">Цена</th>
                <th className="px-1.5 sm:px-4 py-1.5 sm:py-3 font-medium text-right w-18 sm:w-32">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-slate-500">{item.number}</td>
                  <td className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-slate-200 leading-tight">{item.name}</td>
                  <td className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-center text-slate-400">{item.unit}</td>
                  <td className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-right text-slate-300">{item.quantity}</td>
                  <td className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-right text-slate-300 whitespace-nowrap">{formatNumber(item.price)}</td>
                  <td className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-right font-medium text-white whitespace-nowrap">
                    {formatNumber(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`${
                variant === 'customer'
                  ? 'bg-primary-500/10'
                  : 'bg-accent-500/10'
              }`}>
                <td colSpan={5} className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-right font-semibold text-slate-300 text-xs sm:text-sm">
                  Итого по разделу:
                </td>
                <td className={`px-1.5 sm:px-4 py-2.5 sm:py-4 text-right font-bold text-sm sm:text-lg whitespace-nowrap ${
                  variant === 'customer' ? 'text-primary-400' : 'text-accent-400'
                }`}>
                  {formatNumber(section.subtotal)} ₽
                </td>
              </tr>
            </tfoot>
          </table>
        </PinchZoomSection>
      ))}

      {/* Grand total */}
      <div className={`card animate-fade-in bg-gradient-to-r ${
        variant === 'customer'
          ? 'from-primary-500/20 to-primary-600/10 border-primary-500/30'
          : 'from-accent-500/20 to-accent-600/10 border-accent-500/30'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs sm:text-sm mb-1">
              {variant === 'customer' ? 'Итого стоимость работ' : 'Итого к выплате'}
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {formatNumber(data.total)} ₽
            </h3>
          </div>
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${
            variant === 'customer'
              ? 'bg-primary-500/20'
              : 'bg-accent-500/20'
          }`}>
            <svg
              className={`w-6 h-6 sm:w-8 sm:h-8 ${variant === 'customer' ? 'text-primary-400' : 'text-accent-400'}`}
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
