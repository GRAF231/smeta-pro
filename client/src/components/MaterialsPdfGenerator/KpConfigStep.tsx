import { formatMoney } from '../../utils/format'

interface KpConfigStepProps {
  kpNumber: string
  kpDate: string
  executorName: string
  executorDetails: string
  validDays: string
  materialsCount: number
  grandTotal: number
  onKpNumberChange: (value: string) => void
  onKpDateChange: (value: string) => void
  onExecutorNameChange: (value: string) => void
  onExecutorDetailsChange: (value: string) => void
  onValidDaysChange: (value: string) => void
}

export default function KpConfigStep({
  kpNumber,
  kpDate,
  executorName,
  executorDetails,
  validDays,
  materialsCount,
  grandTotal,
  onKpNumberChange,
  onKpDateChange,
  onExecutorNameChange,
  onExecutorDetailsChange,
  onValidDaysChange,
}: KpConfigStepProps) {
  return (
    <div className="p-6 space-y-6">
      {/* KP Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Номер КП</label>
          <input type="text" value={kpNumber} onChange={e => onKpNumberChange(e.target.value)} placeholder="3574" className="input-field" />
        </div>
        <div>
          <label className="label">Дата КП</label>
          <input type="date" value={kpDate} onChange={e => onKpDateChange(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label">Срок действия (дней)</label>
          <input type="number" value={validDays} onChange={e => onValidDaysChange(e.target.value)} placeholder="10" className="input-field" />
        </div>
      </div>

      {/* Executor */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">И</div>
          Исполнитель *
        </h3>
        <div>
          <label className="label">Наименование</label>
          <input type="text" value={executorName} onChange={e => onExecutorNameChange(e.target.value)} placeholder="ИП Чурина Елизавета Алексеевна" className="input-field" />
        </div>
        <div>
          <label className="label">Адрес, контакты</label>
          <textarea value={executorDetails} onChange={e => onExecutorDetailsChange(e.target.value)} placeholder="Свердловская обл, г Талица, ул Кузнецова, д 62, кв 2, тел: +7(922)606-19-11 e-mail: info@example.com" className="input-field min-h-[80px]" rows={2} />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Материалов в КП: <strong className="text-white">{materialsCount}</strong></span>
          <span className="font-display font-bold text-primary-400 text-lg">{formatMoney(grandTotal)} ₽</span>
        </div>
      </div>
    </div>
  )
}



