import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import { IconBolt } from '../../components/ui/Icons'

interface AddMaterialsModalProps {
  isOpen: boolean
  urlsInput: string
  isParsing: boolean
  parseProgress: string
  onClose: () => void
  onUrlsInputChange: (value: string) => void
  onParse: () => void
}

export default function AddMaterialsModal({
  isOpen,
  urlsInput,
  isParsing,
  parseProgress,
  onClose,
  onUrlsInputChange,
  onParse,
}: AddMaterialsModalProps) {
  if (!isOpen) return null

  return (
    <Modal
      title="Добавить материалы"
      maxWidth="max-w-2xl"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isParsing}
          >
            Отмена
          </button>
          <button
            onClick={onParse}
            disabled={isParsing || !urlsInput.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {isParsing ? (
              <>
                <Spinner size="sm" className="border-white" />
                Парсинг...
              </>
            ) : (
              <>
                <IconBolt className="w-5 h-5" />
                Распознать через ИИ
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">
            Ссылки на товары (по одной на строку)
          </label>
          <textarea
            value={urlsInput}
            onChange={e => onUrlsInputChange(e.target.value)}
            placeholder={`https://example.com/product-1\nhttps://example.com/product-2\nhttps://example.com/product-3`}
            className="input-field min-h-[200px] font-mono text-sm"
            rows={8}
            disabled={isParsing}
          />
          <p className="text-xs text-slate-500 mt-2">
            Вставьте ссылки на страницы товаров интернет-магазинов. ИИ автоматически извлечёт название, цену, артикул и характеристики.
          </p>
        </div>

        {parseProgress && (
          <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
            <Spinner size="sm" className="flex-shrink-0" />
            <span className="text-sm text-primary-300">{parseProgress}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}




