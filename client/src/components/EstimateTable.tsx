import { EstimateData } from '../services/api'

interface EstimateTableProps {
  data: EstimateData
  variant: 'customer' | 'master'
}

export default function EstimateTable({ data, variant }: EstimateTableProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  return (
    <div className="space-y-6">
      {data.sections.map((section, sectionIdx) => (
        <div 
          key={section.name} 
          className="card animate-fade-in overflow-hidden"
          style={{ animationDelay: `${sectionIdx * 50}ms` }}
        >
          {/* Section header */}
          <div className={`-mx-6 -mt-6 mb-6 px-6 py-4 bg-gradient-to-r ${
            variant === 'customer' 
              ? 'from-primary-500/10 to-primary-600/5 border-b border-primary-500/20' 
              : 'from-accent-500/10 to-accent-600/5 border-b border-accent-500/20'
          }`}>
            <h2 className="font-display font-semibold text-lg text-white">
              {section.name}
            </h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-700/50">
                  <th className="px-6 py-3 font-medium w-12">№</th>
                  <th className="px-6 py-3 font-medium">Наименование работ</th>
                  <th className="px-6 py-3 font-medium text-center w-20">Ед.</th>
                  <th className="px-6 py-3 font-medium text-right w-24">Кол-во</th>
                  <th className="px-6 py-3 font-medium text-right w-28">Цена</th>
                  <th className="px-6 py-3 font-medium text-right w-32">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-6 py-3 text-slate-500">{item.number}</td>
                    <td className="px-6 py-3 text-slate-200">{item.name}</td>
                    <td className="px-6 py-3 text-center text-slate-400">{item.unit}</td>
                    <td className="px-6 py-3 text-right text-slate-300">{item.quantity}</td>
                    <td className="px-6 py-3 text-right text-slate-300">{formatNumber(item.price)}</td>
                    <td className="px-6 py-3 text-right font-medium text-white">
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
                  <td colSpan={5} className="px-6 py-4 text-right font-semibold text-slate-300">
                    Итого по разделу:
                  </td>
                  <td className={`px-6 py-4 text-right font-bold text-lg ${
                    variant === 'customer' ? 'text-primary-400' : 'text-accent-400'
                  }`}>
                    {formatNumber(section.subtotal)} ₽
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}

      {/* Grand total */}
      <div className={`card animate-fade-in bg-gradient-to-r ${
        variant === 'customer'
          ? 'from-primary-500/20 to-primary-600/10 border-primary-500/30'
          : 'from-accent-500/20 to-accent-600/10 border-accent-500/30'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm mb-1">
              {variant === 'customer' ? 'Итого стоимость работ' : 'Итого к выплате'}
            </p>
            <h3 className="font-display text-3xl font-bold text-white">
              {formatNumber(data.total)} ₽
            </h3>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            variant === 'customer'
              ? 'bg-primary-500/20'
              : 'bg-accent-500/20'
          }`}>
            <svg 
              className={`w-8 h-8 ${variant === 'customer' ? 'text-primary-400' : 'text-accent-400'}`} 
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

