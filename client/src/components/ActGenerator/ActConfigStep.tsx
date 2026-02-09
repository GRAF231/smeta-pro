import type { EstimateView, ViewId } from '../../types'
import { IconEye, IconPlus } from '../ui/Icons'
import Spinner from '../ui/Spinner'
import { asViewId } from '../../types'

type ImageType = 'logo' | 'stamp' | 'signature'
const IMAGE_LABELS: Record<ImageType, string> = {
  logo: 'Логотип',
  stamp: 'Печать',
  signature: 'Подпись',
}

interface ActConfigStepProps {
  views: EstimateView[]
  selectedViewId: ViewId | null
  onViewChange: (viewId: ViewId | null) => void
  actNumber: string
  actDate: string
  executorName: string
  executorDetails: string
  customerName: string
  directorName: string
  images: Record<string, string>
  uploadingImage: string | null
  onActNumberChange: (value: string) => void
  onActDateChange: (value: string) => void
  onExecutorNameChange: (value: string) => void
  onExecutorDetailsChange: (value: string) => void
  onCustomerNameChange: (value: string) => void
  onDirectorNameChange: (value: string) => void
  onImageUpload: (imageType: ImageType, file: File) => void
  onImageDelete: (imageType: ImageType) => void
}

export default function ActConfigStep({
  views,
  selectedViewId,
  onViewChange,
  actNumber,
  actDate,
  executorName,
  executorDetails,
  customerName,
  directorName,
  images,
  uploadingImage,
  onActNumberChange,
  onActDateChange,
  onExecutorNameChange,
  onExecutorDetailsChange,
  onCustomerNameChange,
  onDirectorNameChange,
  onImageUpload,
  onImageDelete,
}: ActConfigStepProps) {
  const openFileDialog = (imageType: ImageType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) onImageUpload(imageType, file)
    }
    input.click()
  }

  return (
    <div className="space-y-6">
      {/* View selector for pricing */}
      {views.length > 1 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs">
              <IconEye className="w-3.5 h-3.5" />
            </div>
            Цены из представления
          </h3>
          <div className="flex flex-wrap gap-2">
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => onViewChange(asViewId(view.id))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedViewId === asViewId(view.id)
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                }`}
              >
                {view.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Выберите, цены из какого представления использовать для расчёта акта</p>
        </div>
      )}

      {/* Images Upload */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-green-400 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          Изображения для акта
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['logo', 'stamp', 'signature'] as ImageType[]).map(type => (
            <div key={type} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
              <div className="text-sm text-slate-400 mb-3 font-medium">{IMAGE_LABELS[type]}</div>
              {images[type] ? (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-2 flex items-center justify-center" style={{ minHeight: '80px' }}>
                    <img src={images[type]} alt={IMAGE_LABELS[type]} className="max-h-20 max-w-full object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openFileDialog(type)} disabled={uploadingImage === type} className="flex-1 text-xs px-3 py-1.5 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">Заменить</button>
                    <button onClick={() => onImageDelete(type)} className="text-xs px-3 py-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">Удалить</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => openFileDialog(type)} disabled={uploadingImage === type} className="w-full border-2 border-dashed border-slate-600 rounded-lg py-6 flex flex-col items-center gap-2 hover:border-primary-500/50 hover:bg-slate-700/30 transition-all cursor-pointer">
                  {uploadingImage === type ? <Spinner size="sm" /> : (
                    <>
                      <IconPlus className="w-6 h-6 text-slate-500" />
                      <span className="text-xs text-slate-500">Загрузить PNG/JPG</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Act Details */}
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Номер акта *</label>
          <input type="text" value={actNumber} onChange={e => onActNumberChange(e.target.value)} placeholder="170" className="input-field" />
        </div>
        <div>
          <label className="label">Дата акта</label>
          <input type="date" value={actDate} onChange={e => onActDateChange(e.target.value)} className="input-field" />
        </div>
      </div>

      {/* Executor & Customer & Signature */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">И</div>
          Исполнитель
        </h3>
        <div>
          <label className="label">Наименование исполнителя *</label>
          <input type="text" value={executorName} onChange={e => onExecutorNameChange(e.target.value)} placeholder="ИП Чурина Елизавета Алексеевна" className="input-field" />
        </div>
        <div>
          <label className="label">Реквизиты (ИНН, адрес и т.д.)</label>
          <textarea value={executorDetails} onChange={e => onExecutorDetailsChange(e.target.value)} placeholder="ИНН 665404395460, 623640, Россия, Свердловская обл, Талицкий р-н, г Талица, ул Кузнецова, д 62, кв 2" className="input-field min-h-[80px]" rows={2} />
        </div>
        <div className="border-t border-slate-700/50 pt-4">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-accent-500/20 flex items-center justify-center text-accent-400 text-xs font-bold">З</div>
            Заказчик
          </h3>
          <div>
            <label className="label">ФИО заказчика *</label>
            <input type="text" value={customerName} onChange={e => onCustomerNameChange(e.target.value)} placeholder="Шаповалова Елена Владимировна" className="input-field" />
          </div>
        </div>
        <div className="border-t border-slate-700/50 pt-4">
          <h3 className="font-semibold text-white mb-4">Подпись</h3>
          <div>
            <label className="label">ФИО директора (для подписи)</label>
            <input type="text" value={directorName} onChange={e => onDirectorNameChange(e.target.value)} placeholder="Чурина Е.А." className="input-field" />
          </div>
        </div>
      </div>
    </div>
  )
}

