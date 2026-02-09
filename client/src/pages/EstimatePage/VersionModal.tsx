import { useState, useEffect } from 'react'
import { projectsApi } from '../../services/api'
import type { EstimateVersion, EstimateVersionWithSections } from '../../types'
import Spinner from '../../components/ui/Spinner'
import { IconBack, IconSync, IconClock, IconChevronRight } from '../../components/ui/Icons'

interface VersionModalProps {
  projectId: string
  onClose: () => void
  onRestored: () => Promise<void>
  onError: (msg: string) => void
}

export default function VersionModal({ projectId, onClose, onRestored, onError }: VersionModalProps) {
  const [versions, setVersions] = useState<EstimateVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<EstimateVersionWithSections | null>(null)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [isLoadingVersions, setIsLoadingVersions] = useState(true)
  const [isRestoringVersion, setIsRestoringVersion] = useState(false)

  // Load versions on mount
  useEffect(() => {
    loadVersions()
  }, [])

  const loadVersions = async () => {
    setIsLoadingVersions(true)
    try {
      const res = await projectsApi.getVersions(projectId)
      setVersions(res.data)
    } catch {
      onError('Ошибка загрузки версий')
    } finally {
      setIsLoadingVersions(false)
    }
  }

  const handleCreateVersion = async () => {
    setIsCreatingVersion(true)
    try {
      await projectsApi.createVersion(projectId, newVersionName || undefined)
      setNewVersionName('')
      await loadVersions()
    } catch {
      onError('Ошибка создания версии')
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const handleSelectVersion = async (versionId: string) => {
    try {
      const res = await projectsApi.getVersion(projectId, versionId)
      setSelectedVersion(res.data)
    } catch {
      onError('Ошибка загрузки версии')
    }
  }

  const handleRestoreVersion = async () => {
    if (!selectedVersion) return
    if (!confirm(`Восстановить смету из версии ${selectedVersion.versionNumber}${selectedVersion.name ? ` "${selectedVersion.name}"` : ''}? Текущие данные будут заменены.`)) return

    setIsRestoringVersion(true)
    try {
      await projectsApi.restoreVersion(projectId, selectedVersion.id)
      await onRestored()
      onClose()
    } catch {
      onError('Ошибка восстановления версии')
    } finally {
      setIsRestoringVersion(false)
    }
  }

  const title = selectedVersion ? `Версия ${selectedVersion.versionNumber}` : 'История версий'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-display text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedVersion ? (
            <VersionDetail
              version={selectedVersion}
              isRestoring={isRestoringVersion}
              onBack={() => setSelectedVersion(null)}
              onRestore={handleRestoreVersion}
            />
          ) : (
            <VersionList
              versions={versions}
              isLoading={isLoadingVersions}
              newVersionName={newVersionName}
              isCreating={isCreatingVersion}
              onNewVersionNameChange={setNewVersionName}
              onCreate={handleCreateVersion}
              onSelect={handleSelectVersion}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// === Sub-components ===

function VersionDetail({ version, isRestoring, onBack, onRestore }: {
  version: EstimateVersionWithSections
  isRestoring: boolean
  onBack: () => void
  onRestore: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-1">
          <IconBack className="w-4 h-4" />
          Назад к списку
        </button>
        <button onClick={onRestore} disabled={isRestoring} className="btn-primary flex items-center gap-2">
          <IconSync className="w-5 h-5" />
          {isRestoring ? 'Восстановление...' : 'Восстановить'}
        </button>
      </div>

      <div className="bg-slate-700/30 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-400">Название:</span><span className="ml-2 text-white">{version.name || '—'}</span></div>
          <div><span className="text-slate-400">Создана:</span><span className="ml-2 text-white">{new Date(version.createdAt).toLocaleString('ru-RU')}</span></div>
        </div>
        {version.views && version.views.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {version.views.map(v => (
              <span key={v.id} className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-300">{v.name}</span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {version.sections.map(section => (
          <div key={section.id} className="bg-slate-700/20 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-700/30 border-b border-slate-700/50">
              <h3 className="font-semibold text-white">{section.name}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700/30">
                    <th className="px-4 py-2">Наименование</th>
                    <th className="px-4 py-2 w-16">Ед.</th>
                    <th className="px-4 py-2 w-20 text-right">Кол-во</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map(item => (
                    <tr key={item.id} className="border-b border-slate-700/20">
                      <td className="px-4 py-2 text-slate-200">{item.name}</td>
                      <td className="px-4 py-2 text-slate-400">{item.unit}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VersionList({ versions, isLoading, newVersionName, isCreating, onNewVersionNameChange, onCreate, onSelect }: {
  versions: EstimateVersion[]
  isLoading: boolean
  newVersionName: string
  isCreating: boolean
  onNewVersionNameChange: (name: string) => void
  onCreate: () => void
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-700/30 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-3">Сохранить текущую версию</h3>
        <div className="flex gap-3">
          <input type="text" value={newVersionName} onChange={(e) => onNewVersionNameChange(e.target.value)} placeholder="Название версии (необязательно)" className="input-field flex-1" />
          <button onClick={onCreate} disabled={isCreating} className="btn-primary whitespace-nowrap">
            {isCreating ? 'Сохранение...' : 'Сохранить версию'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-3">Сохранённые версии</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <IconClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Версий пока нет</p>
            <p className="text-sm mt-1">Сохраните первую версию</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map(version => (
              <button key={version.id} onClick={() => onSelect(version.id)} className="w-full flex items-center justify-between p-4 bg-slate-700/20 hover:bg-slate-700/40 rounded-xl transition-colors text-left">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">Версия {version.versionNumber}</span>
                    {version.name && <span className="text-primary-400">"{version.name}"</span>}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{new Date(version.createdAt).toLocaleString('ru-RU')}</p>
                </div>
                <IconChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

