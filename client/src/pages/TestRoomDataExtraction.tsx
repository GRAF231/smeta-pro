import { useState } from 'react'
import { projectsApi } from '../services/api'
import FileUploadZone from './AiEstimateGenerator/components/FileUploadZone'
import { useFileUpload } from './AiEstimateGenerator/hooks/useFileUpload'
import Button from '../components/ui/Button'

interface RoomDataExtractionResult {
  taskId: string
  totalPages: number
  roomsProcessed: number
  results: Array<{
    roomName: string
    extractedData: {
      wallMaterials: Array<{
        material: string
        description: string
        area?: number
      }>
      floorMaterial: {
        material: string
        description: string
        area?: number
      } | null
      ceilingMaterial: {
        material: string
        description: string
        area?: number
      } | null
      electrical: {
        outlets: number
        switches: number
        fixtures: number
        locations?: Array<{
          type: 'outlet' | 'switch' | 'fixture'
          description: string
        }>
      }
      openings: Array<{
        type: 'door' | 'window' | 'arch'
        width?: number
        height?: number
        description: string
      }>
      dimensions: {
        length?: number
        width?: number
        height?: number
        area?: number
      }
      notes?: string[]
    }
    savedRoomDataId: string
    highQualityRegionsCount: number
    materialBills: Array<{
      title: string
      roomName?: string
      items: Array<{
        position: number
        name: string
        unit: string
        quantity: number | null
        article?: string
        brand?: string
        manufacturer?: string
        description?: string
      }>
    }>
    materialBillImagesCount: number
  }>
  highQualityRegions: Array<{
    roomName: string
    index: number
    image: string
  }>
  materialBillImages: Array<{
    roomName: string
    index: number
    image: string
  }>
}

/**
 * Страница для тестирования извлечения данных помещений
 */
export default function TestRoomDataExtraction() {
  const fileUpload = useFileUpload()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RoomDataExtractionResult | null>(null)
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(null)

  const handleTest = async () => {
    if (!fileUpload.pdfFile) {
      setError('Загрузите PDF файл')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)
    setSelectedRoomIndex(null)

    try {
      const formData = new FormData()
      formData.append('pdf', fileUpload.pdfFile)

      const response = await projectsApi.testRoomDataExtraction(formData)
      setResult(response.data)
      if (response.data.results.length > 0) {
        setSelectedRoomIndex(0)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка извлечения данных помещений')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRoom = selectedRoomIndex !== null && result ? result.results[selectedRoomIndex] : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Тестирование извлечения данных помещений
            </h1>
            <p className="text-sm text-slate-400">
              Загрузите PDF дизайн-проект для извлечения детальных данных по каждому помещению
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <FileUploadZone
            pdfFile={fileUpload.pdfFile}
            isDragOver={fileUpload.isDragOver}
            isLoading={isLoading}
            fileInputRef={fileUpload.fileInputRef}
            onDragOver={fileUpload.handleDragOver}
            onDragLeave={fileUpload.handleDragLeave}
            onDrop={fileUpload.handleDrop}
            onFileSelect={fileUpload.handleFileSelect}
            onRemove={fileUpload.removePdf}
          />

          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleTest}
            loading={isLoading}
            disabled={!fileUpload.pdfFile}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
          >
            Извлечь данные помещений
          </Button>

          {result && (
            <div className="mt-8 space-y-6">
              {/* Summary */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h3 className="font-medium text-white mb-4">Общая информация</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Всего страниц</div>
                    <div className="text-2xl font-bold text-white">{result.totalPages}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Обработано помещений</div>
                    <div className="text-2xl font-bold text-white">{result.roomsProcessed}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Важных областей</div>
                    <div className="text-2xl font-bold text-white">{result.highQualityRegions.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Таблиц с ведомостями</div>
                    <div className="text-2xl font-bold text-white">{result.materialBillImages.length}</div>
                  </div>
                </div>
              </div>

              {/* Rooms List */}
              {result.results.length > 0 && (
                <div className="bg-slate-700/30 rounded-xl p-6">
                  <h3 className="font-medium text-white mb-4">Помещения</h3>
                  <div className="space-y-2">
                    {result.results.map((room, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedRoomIndex(index)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          selectedRoomIndex === index
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{room.roomName}</div>
                            <div className="text-sm text-slate-400 mt-1">
                              {room.highQualityRegionsCount} важных областей •{' '}
                              {room.materialBillImagesCount} таблиц с ведомостями •{' '}
                              {room.extractedData.wallMaterials.length} материалов стен •{' '}
                              {room.extractedData.openings.length} проемов
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 transition-transform ${
                              selectedRoomIndex === index ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Room Details */}
              {selectedRoom && (
                <div className="bg-slate-700/30 rounded-xl p-6 space-y-6">
                  <h3 className="font-medium text-white text-xl">{selectedRoom.roomName}</h3>

                  {/* Wall Materials */}
                  {selectedRoom.extractedData.wallMaterials.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Материалы отделки стен</h4>
                      <div className="space-y-2">
                        {selectedRoom.extractedData.wallMaterials.map((material, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                          >
                            <div className="font-medium text-white">{material.material}</div>
                            {material.description && (
                              <div className="text-sm text-slate-400 mt-1">{material.description}</div>
                            )}
                            {material.area && (
                              <div className="text-sm text-purple-400 mt-2">Площадь: {material.area} м²</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floor Material */}
                  {selectedRoom.extractedData.floorMaterial && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Напольное покрытие</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="font-medium text-white">{selectedRoom.extractedData.floorMaterial.material}</div>
                        {selectedRoom.extractedData.floorMaterial.description && (
                          <div className="text-sm text-slate-400 mt-1">
                            {selectedRoom.extractedData.floorMaterial.description}
                          </div>
                        )}
                        {selectedRoom.extractedData.floorMaterial.area && (
                          <div className="text-sm text-purple-400 mt-2">
                            Площадь: {selectedRoom.extractedData.floorMaterial.area} м²
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ceiling Material */}
                  {selectedRoom.extractedData.ceilingMaterial && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Потолок</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="font-medium text-white">
                          {selectedRoom.extractedData.ceilingMaterial.material}
                        </div>
                        {selectedRoom.extractedData.ceilingMaterial.description && (
                          <div className="text-sm text-slate-400 mt-1">
                            {selectedRoom.extractedData.ceilingMaterial.description}
                          </div>
                        )}
                        {selectedRoom.extractedData.ceilingMaterial.area && (
                          <div className="text-sm text-purple-400 mt-2">
                            Площадь: {selectedRoom.extractedData.ceilingMaterial.area} м²
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Electrical */}
                  {(selectedRoom.extractedData.electrical.outlets > 0 ||
                    selectedRoom.extractedData.electrical.switches > 0 ||
                    selectedRoom.extractedData.electrical.fixtures > 0) && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Электрика</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-sm text-slate-400">Розетки</div>
                            <div className="text-xl font-bold text-white">
                              {selectedRoom.extractedData.electrical.outlets}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">Выключатели</div>
                            <div className="text-xl font-bold text-white">
                              {selectedRoom.extractedData.electrical.switches}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">Светильники</div>
                            <div className="text-xl font-bold text-white">
                              {selectedRoom.extractedData.electrical.fixtures}
                            </div>
                          </div>
                        </div>
                        {selectedRoom.extractedData.electrical.locations &&
                          selectedRoom.extractedData.electrical.locations.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                              <div className="text-sm text-slate-400 mb-2">Расположение:</div>
                              <div className="space-y-1">
                                {selectedRoom.extractedData.electrical.locations.map((loc, index) => (
                                  <div key={index} className="text-sm text-slate-300">
                                    • {loc.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Openings */}
                  {selectedRoom.extractedData.openings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Проемы</h4>
                      <div className="space-y-2">
                        {selectedRoom.extractedData.openings.map((opening, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                {opening.type === 'door' ? 'Дверь' : opening.type === 'window' ? 'Окно' : 'Арка'}
                              </span>
                              {(opening.width || opening.height) && (
                                <span className="text-sm text-purple-400">
                                  {opening.width && `${opening.width}м`}
                                  {opening.width && opening.height && ' × '}
                                  {opening.height && `${opening.height}м`}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-300">{opening.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dimensions */}
                  {(selectedRoom.extractedData.dimensions.length ||
                    selectedRoom.extractedData.dimensions.width ||
                    selectedRoom.extractedData.dimensions.height ||
                    selectedRoom.extractedData.dimensions.area) ? (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Размеры помещения</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedRoom.extractedData.dimensions.length !== undefined && (
                            <div>
                              <div className="text-sm text-slate-400">Длина</div>
                              <div className="text-lg font-bold text-white">
                                {selectedRoom.extractedData.dimensions.length} м
                              </div>
                            </div>
                          )}
                          {selectedRoom.extractedData.dimensions.width && (
                            <div>
                              <div className="text-sm text-slate-400">Ширина</div>
                              <div className="text-lg font-bold text-white">
                                {selectedRoom.extractedData.dimensions.width} м
                              </div>
                            </div>
                          )}
                          {selectedRoom.extractedData.dimensions.height && (
                            <div>
                              <div className="text-sm text-slate-400">Высота</div>
                              <div className="text-lg font-bold text-white">
                                {selectedRoom.extractedData.dimensions.height} м
                              </div>
                            </div>
                          )}
                          {selectedRoom.extractedData.dimensions.area && (
                            <div>
                              <div className="text-sm text-slate-400">Площадь</div>
                              <div className="text-lg font-bold text-white">
                                {selectedRoom.extractedData.dimensions.area} м²
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Notes */}
                  {selectedRoom.extractedData.notes && selectedRoom.extractedData.notes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Примечания</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <ul className="space-y-1">
                          {selectedRoom.extractedData.notes.map((note, index) => (
                            <li key={index} className="text-sm text-slate-300">
                              • {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Material Bills */}
                  {selectedRoom.materialBills && selectedRoom.materialBills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Ведомости материалов ({selectedRoom.materialBills.length})
                      </h4>
                      <div className="space-y-4">
                        {selectedRoom.materialBills.map((bill, billIndex) => (
                          <div
                            key={billIndex}
                            className="bg-slate-800/50 rounded-lg p-4 border border-emerald-500/30"
                          >
                            <div className="font-medium text-white mb-3">{bill.title}</div>
                            {bill.items.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-700/50">
                                      <th className="text-left py-2 px-3 text-slate-300">№</th>
                                      <th className="text-left py-2 px-3 text-slate-300">Наименование</th>
                                      <th className="text-left py-2 px-3 text-slate-300">Ед. изм.</th>
                                      <th className="text-right py-2 px-3 text-slate-300">Количество</th>
                                      {bill.items.some((item) => item.article) && (
                                        <th className="text-left py-2 px-3 text-slate-300">Артикул</th>
                                      )}
                                      {bill.items.some((item) => item.brand) && (
                                        <th className="text-left py-2 px-3 text-slate-300">Марка</th>
                                      )}
                                      {bill.items.some((item) => item.manufacturer) && (
                                        <th className="text-left py-2 px-3 text-slate-300">Производитель</th>
                                      )}
                                      {bill.items.some((item) => item.description) && (
                                        <th className="text-left py-2 px-3 text-slate-300">Примечания</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bill.items.map((item, itemIndex) => (
                                      <tr
                                        key={itemIndex}
                                        className="border-b border-slate-700/30 hover:bg-slate-700/20"
                                      >
                                        <td className="py-2 px-3 text-slate-400">{item.position}</td>
                                        <td className="py-2 px-3 text-white font-medium">{item.name}</td>
                                        <td className="py-2 px-3 text-slate-400">{item.unit}</td>
                                        <td className="py-2 px-3 text-right text-purple-400">
                                          {item.quantity !== null ? item.quantity : '-'}
                                        </td>
                                        {bill.items.some((i) => i.article) && (
                                          <td className="py-2 px-3 text-slate-400">{item.article || '-'}</td>
                                        )}
                                        {bill.items.some((i) => i.brand) && (
                                          <td className="py-2 px-3 text-slate-400">{item.brand || '-'}</td>
                                        )}
                                        {bill.items.some((i) => i.manufacturer) && (
                                          <td className="py-2 px-3 text-slate-400">{item.manufacturer || '-'}</td>
                                        )}
                                        {bill.items.some((i) => i.description) && (
                                          <td className="py-2 px-3 text-slate-400 text-xs">
                                            {item.description || '-'}
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400">Нет данных в таблице</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Material Bill Images */}
                  {result.materialBillImages.filter((r) => r.roomName === selectedRoom.roomName).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Таблицы с ведомостями материалов в высоком разрешении ({result.materialBillImages.filter((r) => r.roomName === selectedRoom.roomName).length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.materialBillImages
                          .filter((r) => r.roomName === selectedRoom.roomName)
                          .map((region, index) => (
                            <div
                              key={index}
                              className="bg-slate-800/50 rounded-lg overflow-hidden border border-emerald-500/30"
                            >
                              <img
                                src={region.image}
                                alt={`Material bill table ${index + 1}`}
                                className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(region.image, '_blank')}
                              />
                              <div className="p-2 text-xs text-emerald-400 text-center">
                                Таблица ведомости {index + 1}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* High Quality Regions */}
                  {result.highQualityRegions.filter((r) => r.roomName === selectedRoom.roomName).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Другие важные области в высоком разрешении ({result.highQualityRegions.filter((r) => r.roomName === selectedRoom.roomName).length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.highQualityRegions
                          .filter((r) => r.roomName === selectedRoom.roomName)
                          .map((region, index) => (
                            <div
                              key={index}
                              className="bg-slate-800/50 rounded-lg overflow-hidden border border-purple-500/30"
                            >
                              <img
                                src={region.image}
                                alt={`High quality region ${index + 1}`}
                                className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(region.image, '_blank')}
                              />
                              <div className="p-2 text-xs text-slate-400 text-center">
                                Область {index + 1}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

