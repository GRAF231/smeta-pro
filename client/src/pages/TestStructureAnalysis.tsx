import { useState } from 'react'
import { projectsApi } from '../services/api'
import FileUploadZone from './AiEstimateGenerator/components/FileUploadZone'
import { useFileUpload } from './AiEstimateGenerator/hooks/useFileUpload'
import Button from '../components/ui/Button'

interface StructureAnalysisResult {
  taskId: string
  totalPages: number
  titlePagesCount: number
  planPagesCount: number
  structure: {
    totalArea: number | null
    address: string | null
    roomCount: number
    rooms: Array<{
      name: string
      type: string | null
      area: number | null
      planType: 'original' | 'renovated' | 'both'
      source: string
    }>
    planTypes: string[]
  }
  savedRoomData: Array<{
    id: string
    room_name: string
    room_type: string | null
    area: number | null
  }>
  titlePages: string[]
  planPages: string[]
  tableImages: string[]
}

const PLAN_TYPE_LABELS: Record<string, string> = {
  original: 'Исходный план',
  renovated: 'План после перепланировки',
  both: 'Оба плана',
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  // Основные помещения
  kitchen: 'Кухня',
  bedroom: 'Спальня',
  bathroom: 'Ванная',
  corridor: 'Коридор',
  living: 'Гостиная',
  loggia: 'Лоджия',
  wardrobe: 'Гардеробная',
  other: 'Прочее',
  
  // Дополнительные типы
  hall: 'Прихожая',
  entrance: 'Прихожая',
  hallway: 'Коридор',
  dining: 'Столовая',
  'dining-room': 'Столовая',
  'dining_room': 'Столовая',
  study: 'Кабинет',
  office: 'Кабинет',
  'home-office': 'Кабинет',
  'home_office': 'Кабинет',
  balcony: 'Балкон',
  'kitchen-living': 'Кухня-гостиная',
  'kitchen-living-room': 'Кухня-гостиная',
  'kitchen_living_room': 'Кухня-гостиная',
  'kitchen-dining': 'Кухня-столовая',
  'kitchen-dining-room': 'Кухня-столовая',
  'kitchen_dining_room': 'Кухня-столовая',
  'living-room': 'Гостиная',
  'living_room': 'Гостиная',
  'bath-room': 'Ванная',
  'bath_room': 'Ванная',
  shower: 'Душевая',
  'shower-room': 'Душевая',
  'shower_room': 'Душевая',
  'walk-in-closet': 'Гардеробная',
  'walk_in_closet': 'Гардеробная',
  closet: 'Гардеробная',
  'walk-in': 'Гардеробная',
  'walk_in': 'Гардеробная',
  storage: 'Кладовая',
  'storage-room': 'Кладовая',
  'storage_room': 'Кладовая',
  pantry: 'Кладовая',
  toilet: 'Туалет',
  wc: 'Туалет',
  'water-closet': 'Туалет',
  'water_closet': 'Туалет',
  laundry: 'Прачечная',
  'laundry-room': 'Прачечная',
  'laundry_room': 'Прачечная',
  'utility-room': 'Прачечная',
  'utility_room': 'Прачечная',
  nursery: 'Детская',
  'children-room': 'Детская',
  'children_room': 'Детская',
  'kids-room': 'Детская',
  'kids_room': 'Детская',
  'guest-room': 'Гостевая',
  'guest_room': 'Гостевая',
  guest: 'Гостевая',
  library: 'Библиотека',
  'game-room': 'Игровая',
  'game_room': 'Игровая',
  'playroom': 'Игровая',
  'play-room': 'Игровая',
  'play_room': 'Игровая',
  gym: 'Спортзал',
  'gym-room': 'Спортзал',
  'gym_room': 'Спортзал',
  'fitness-room': 'Спортзал',
  'fitness_room': 'Спортзал',
  sauna: 'Сауна',
  'sauna-room': 'Сауна',
  'sauna_room': 'Сауна',
  'wine-cellar': 'Винный погреб',
  'wine_cellar': 'Винный погреб',
  cellar: 'Погреб',
  basement: 'Подвал',
  attic: 'Чердак',
  'roof-terrace': 'Терраса',
  'roof_terrace': 'Терраса',
  terrace: 'Терраса',
  'mud-room': 'Прихожая',
  'mud_room': 'Прихожая',
  'entry-hall': 'Прихожая',
  'entry_hall': 'Прихожая',
  foyer: 'Прихожая',
  vestibule: 'Прихожая',
  'master-bedroom': 'Главная спальня',
  'master_bedroom': 'Главная спальня',
  'second-bedroom': 'Вторая спальня',
  'second_bedroom': 'Вторая спальня',
  'third-bedroom': 'Третья спальня',
  'third_bedroom': 'Третья спальня',
  'master-bathroom': 'Главная ванная',
  'master_bathroom': 'Главная ванная',
  'guest-bathroom': 'Гостевая ванная',
  'guest_bathroom': 'Гостевая ванная',
  'powder-room': 'Гостевая ванная',
  'powder_room': 'Гостевая ванная',
  'half-bath': 'Гостевая ванная',
  'half_bath': 'Гостевая ванная',
}

// Helper to check if room type should be displayed (only show Russian/known types)
const shouldShowRoomType = (type: string | null): boolean => {
  if (!type) return false
  // Only show if it's in our known labels (Russian types)
  return type in ROOM_TYPE_LABELS
}

/**
 * Страница для тестирования анализа структуры проекта
 */
export default function TestStructureAnalysis() {
  const fileUpload = useFileUpload()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<StructureAnalysisResult | null>(null)

  const handleTest = async () => {
    if (!fileUpload.pdfFile) {
      setError('Загрузите PDF файл')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('pdf', fileUpload.pdfFile)

      const response = await projectsApi.testStructureAnalysis(formData)
      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка анализа структуры проекта')
    } finally {
      setIsLoading(false)
    }
  }

  const totalArea = result?.structure.rooms.reduce((sum, room) => sum + (room.area || 0), 0) || 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Тестирование анализа структуры проекта
            </h1>
            <p className="text-sm text-slate-400">
              Загрузите PDF дизайн-проект для анализа структуры и извлечения площадей помещений
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
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
          >
            Анализировать структуру проекта
          </Button>

          {result && (
            <div className="mt-8 space-y-6">
              {/* Summary */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h3 className="font-medium text-white mb-4">Общая информация</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Всего страниц</div>
                    <div className="text-2xl font-bold text-white">{result.totalPages}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Титульных страниц</div>
                    <div className="text-2xl font-bold text-white">{result.titlePagesCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Планов</div>
                    <div className="text-2xl font-bold text-white">{result.planPagesCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Помещений</div>
                    <div className="text-2xl font-bold text-white">{result.structure.roomCount}</div>
                  </div>
                </div>
                {result.structure.address && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <div className="text-sm text-slate-400">Адрес</div>
                    <div className="text-white font-medium">{result.structure.address}</div>
                  </div>
                )}
                {(result.structure.totalArea || totalArea > 0) && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <div className="text-sm text-slate-400">Общая площадь</div>
                    <div className="text-2xl font-bold text-white">
                      {result.structure.totalArea || totalArea.toFixed(2)} м²
                    </div>
                  </div>
                )}
              </div>

              {/* Plan Types */}
              {result.structure.planTypes.length > 0 && (
                <div className="bg-slate-700/30 rounded-xl p-6">
                  <h3 className="font-medium text-white mb-4">Типы планов</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.structure.planTypes.map((planType, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-md text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      >
                        {planType}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images sent to AI */}
              {(result.titlePages.length > 0 || result.planPages.length > 0 || result.tableImages.length > 0) && (
                <div className="bg-slate-700/30 rounded-xl p-6">
                  <h3 className="font-medium text-white mb-4">
                    Изображения, отправленные в ИИ
                  </h3>
                  
                  {result.titlePages.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Титульные страницы ({result.titlePages.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.titlePages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50"
                          >
                            <img
                              src={imageUrl}
                              alt={`Title page ${index + 1}`}
                              className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                            <div className="p-2 text-xs text-slate-400 text-center">
                              Титульная страница {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.tableImages.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Таблицы с площадями ({result.tableImages.length}) — отправлены в ИИ для анализа
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.tableImages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/50 rounded-lg overflow-hidden border border-emerald-500/30"
                          >
                            <img
                              src={imageUrl}
                              alt={`Table ${index + 1}`}
                              className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                            <div className="p-2 text-xs text-emerald-400 text-center font-medium">
                              Таблица {index + 1} (высокое качество)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.planPages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Полные планы помещений ({result.planPages.length}) — использованы для обнаружения таблиц
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.planPages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50"
                          >
                            <img
                              src={imageUrl}
                              alt={`Plan ${index + 1}`}
                              className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                            <div className="p-2 text-xs text-slate-400 text-center">
                              План {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rooms */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h3 className="font-medium text-white mb-4">
                  Помещения ({(() => {
                    // Count unique rooms (grouped by name)
                    const normalizeName = (name: string) =>
                      name
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, ' ')
                        .replace(/[–—]/g, '-')
                    const uniqueNames = new Set(
                      result.structure.rooms.map((r) => normalizeName(r.name))
                    )
                    return uniqueNames.size
                  })()})
                </h3>
                <div className="space-y-3">
                  {(() => {
                    // Group rooms by normalized name
                    const normalizeName = (name: string) =>
                      name
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, ' ')
                        .replace(/[–—]/g, '-')

                    const roomsByNormalizedName = new Map<string, typeof result.structure.rooms>()
                    for (const room of result.structure.rooms) {
                      const normalized = normalizeName(room.name)
                      if (!roomsByNormalizedName.has(normalized)) {
                        roomsByNormalizedName.set(normalized, [])
                      }
                      roomsByNormalizedName.get(normalized)!.push(room)
                    }

                    // Process each group and create single display entry
                    const displayRooms: Array<{
                      name: string
                      type: string | null
                      originalArea: number | null
                      renovatedArea: number | null
                      status: 'unchanged' | 'changed' | 'new' | 'removed'
                      source: string
                    }> = []

                    for (const [, rooms] of roomsByNormalizedName.entries()) {
                      const originalRoom = rooms.find((r) => r.planType === 'original')
                      const renovatedRoom = rooms.find((r) => r.planType === 'renovated')

                      if (originalRoom && renovatedRoom) {
                        // Room exists in both plans
                        const areaChanged =
                          originalRoom.area !== null &&
                          renovatedRoom.area !== null &&
                          Math.abs(originalRoom.area - renovatedRoom.area) > 0.01

                        displayRooms.push({
                          name: originalRoom.name, // Use original name
                          type: originalRoom.type || renovatedRoom.type,
                          originalArea: originalRoom.area,
                          renovatedArea: renovatedRoom.area,
                          status: areaChanged ? 'changed' : 'unchanged',
                          source: `${originalRoom.source} / ${renovatedRoom.source}`,
                        })
                      } else if (renovatedRoom && !originalRoom) {
                        // New room (only in renovated plan)
                        displayRooms.push({
                          name: renovatedRoom.name,
                          type: renovatedRoom.type,
                          originalArea: null,
                          renovatedArea: renovatedRoom.area,
                          status: 'new',
                          source: renovatedRoom.source,
                        })
                      } else if (originalRoom && !renovatedRoom) {
                        // Removed room (only in original plan)
                        displayRooms.push({
                          name: originalRoom.name,
                          type: originalRoom.type,
                          originalArea: originalRoom.area,
                          renovatedArea: null,
                          status: 'removed',
                          source: originalRoom.source,
                        })
                      }
                    }

                    // Sort: unchanged first, then changed, then new, then removed
                    displayRooms.sort((a, b) => {
                      const order = { unchanged: 0, changed: 1, new: 2, removed: 3 }
                      return order[a.status] - order[b.status]
                    })

                    return displayRooms.map((room, index) => {
                      const getStatusBadge = () => {
                        switch (room.status) {
                          case 'changed':
                            return (
                              <span className="px-2 py-1 rounded-md text-xs font-medium border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                Площадь изменилась
                              </span>
                            )
                          case 'new':
                            return (
                              <span className="px-2 py-1 rounded-md text-xs font-medium border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                Новое помещение
                              </span>
                            )
                          case 'removed':
                            return (
                              <span className="px-2 py-1 rounded-md text-xs font-medium border bg-red-500/20 text-red-400 border-red-500/30">
                                Помещение удалено
                              </span>
                            )
                          default:
                            return null
                        }
                      }

                      const getAreaDisplay = () => {
                        if (room.status === 'unchanged') {
                          return (
                            <div className="text-lg font-bold text-green-400">
                              {room.originalArea?.toFixed(2) || room.renovatedArea?.toFixed(2) || '?'} м²
                            </div>
                          )
                        } else if (room.status === 'changed') {
                          return (
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-bold text-green-400">
                                {room.originalArea?.toFixed(2) || '?'} м²
                              </div>
                              <div className="text-slate-400">→</div>
                              <div className="text-lg font-bold text-green-400">
                                {room.renovatedArea?.toFixed(2) || '?'} м²
                              </div>
                            </div>
                          )
                        } else if (room.status === 'new') {
                          return (
                            <div className="text-lg font-bold text-green-400">
                              {room.renovatedArea?.toFixed(2) || '?'} м²
                            </div>
                          )
                        } else if (room.status === 'removed') {
                          return (
                            <div className="text-lg font-bold text-slate-500 line-through">
                              {room.originalArea?.toFixed(2) || '?'} м²
                            </div>
                          )
                        }
                        return null
                      }

                      return (
                        <div
                          key={index}
                          className={`bg-slate-800/50 rounded-xl p-4 border ${
                            room.status === 'removed'
                              ? 'border-red-500/30 opacity-75'
                              : room.status === 'new'
                              ? 'border-emerald-500/30'
                              : room.status === 'changed'
                              ? 'border-yellow-500/30'
                              : 'border-slate-700/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                      <span className="text-white font-medium text-lg">
                                        {room.name}
                                      </span>
                                      {shouldShowRoomType(room.type) && (
                                        <span className="px-2 py-1 rounded-md text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                          {ROOM_TYPE_LABELS[room.type!]}
                                        </span>
                                      )}
                                      {getStatusBadge()}
                              </div>
                              {room.source && (
                                <div className="text-xs text-slate-400 mb-2">
                                  Источник: {room.source}
                                </div>
                              )}
                              {getAreaDisplay()}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Statistics by Plan Type */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h3 className="font-medium text-white mb-4">Статистика по типам планов</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['original', 'renovated'] as const).map((planType) => {
                    const rooms = result.structure.rooms.filter((r) => r.planType === planType)
                    const totalArea = rooms.reduce((sum, r) => sum + (r.area || 0), 0)
                    return (
                      <div key={planType} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-sm text-slate-400 mb-2">
                          {PLAN_TYPE_LABELS[planType]}
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{rooms.length}</div>
                        <div className="text-xs text-slate-400">помещений</div>
                        {totalArea > 0 && (
                          <div className="text-lg font-bold text-green-400 mt-2">
                            {totalArea.toFixed(2)} м²
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Task ID */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="text-sm text-slate-400">Task ID</div>
                <div className="text-white font-mono text-xs break-all">{result.taskId}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
