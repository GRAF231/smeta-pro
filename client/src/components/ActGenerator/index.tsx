import { useState } from 'react'
import type { EstimateSection, EstimateView, ProjectId, ViewId } from '../../types'
import { IconBack, IconDownload, IconEye } from '../ui/Icons'
import ActConfigStep from './ActConfigStep'
import ActSelectionStep from './ActSelectionStep'
import ActPreviewStep from './ActPreviewStep'
import { useActConfig } from './hooks/useActConfig'
import { useActSelection } from './hooks/useActSelection'
import { useActImages } from './hooks/useActImages'
import { useUsedItems } from './hooks/useUsedItems'
import { useActPdf } from './hooks/useActPdf'
import { calculateActLines, calculateGrandTotal } from './utils/calculations'
import { asProjectId, asViewId, asSectionId, asItemId } from '../../types'

/**
 * Props for ActGenerator component
 */
interface ActGeneratorProps {
  /** Project ID */
  projectId: ProjectId
  /** Estimate sections */
  sections: EstimateSection[]
  /** Available views */
  views: EstimateView[]
  /** Callback when user clicks back */
  onBack: () => void
}

/**
 * Act generator component
 * 
 * Multi-step wizard for generating acts of completed work:
 * 1. Configuration step - set act details, upload images
 * 2. Selection step - select items from estimate
 * 3. Preview step - preview and download PDF
 * 
 * @example
 * ```tsx
 * <ActGenerator
 *   projectId={projectId}
 *   sections={sections}
 *   views={views}
 *   onBack={() => navigate('/dashboard')}
 * />
 * ```
 */
export default function ActGenerator({ projectId, sections, views, onBack }: ActGeneratorProps) {
  const [step, setStep] = useState<'config' | 'preview'>('config')
  const [selectedViewId, setSelectedViewId] = useState<ViewId | null>(views[0] ? asViewId(views[0].id) : null)

  // Act configuration
  const actConfig = useActConfig(projectId)

  // Selection
  const selection = useActSelection()

  // Images
  const { images, uploadingImage, handleImageUpload, handleImageDelete } = useActImages(asProjectId(projectId))

  // Used items
  const { usedItems, reloadUsedItems } = useUsedItems(asProjectId(projectId))

  // Helper functions for getting item price/total
  const getItemPrice = (item: {
    viewSettings: Record<string, { price: number; total: number; visible: boolean }>
  }) => {
    return selectedViewId ? (item.viewSettings[selectedViewId]?.price ?? 0) : 0
  }

  const getItemTotal = (item: {
    viewSettings: Record<string, { price: number; total: number; visible: boolean }>
  }) => {
    return selectedViewId ? (item.viewSettings[selectedViewId]?.total ?? 0) : 0
  }

  // Filter sections and items by visibility in selected view
  const getVisibleSections = (): EstimateSection[] => {
    return sections.map(section => {
      const visibleItems = selectedViewId
        ? section.items.filter(item => {
            const viewSettings = item.viewSettings[selectedViewId]
            return viewSettings?.visible !== false
          })
        : section.items

      return {
        ...section,
        items: visibleItems,
      }
    }).filter(section => section.items.length > 0)
  }

  // Calculate act lines (always use 'items' mode - sections are converted to items)
  const actLines = calculateActLines(
    sections,
    'items',
    selection.selectedSections,
    selection.selectedItems,
    getItemPrice,
    getItemTotal
  )
  const grandTotal = calculateGrandTotal(actLines)

  // PDF generation
  const { actRef, isGenerating, handleDownload } = useActPdf({
    projectId: asProjectId(projectId),
    selectedViewId: selectedViewId ?? null,
    selectionMode: 'items', // Always use 'items' mode - sections are converted to items
    selectedSections: new Set(Array.from(selection.selectedSections).map(id => asSectionId(id))),
    selectedItems: new Set(Array.from(selection.selectedItems).map(id => asItemId(id))),
    sections,
    actLines,
    actNumber: actConfig.actNumber,
    actDate: actConfig.actDate,
    executorName: actConfig.executorName,
    executorDetails: actConfig.executorDetails,
    customerName: actConfig.customerName,
    directorName: actConfig.directorName,
    serviceName: actConfig.serviceName,
    getItemPrice,
    getItemTotal,
    onUsedItemsReload: reloadUsedItems,
  })

  // Toggle handlers with section lookup (using visible sections only)
  const handleToggleSection = (sectionId: string) => {
    const visibleSections = getVisibleSections()
    const section = visibleSections.find(s => s.id === sectionId)
    selection.toggleSection(sectionId, section)
  }

  const handleToggleItem = (sectionId: string, itemId: string) => {
    const visibleSections = getVisibleSections()
    const section = visibleSections.find(s => s.id === sectionId)
    selection.toggleItem(sectionId, itemId, section)
  }

  const handleSelectAll = () => {
    const visibleSections = getVisibleSections()
    selection.selectAll(visibleSections)
  }

  const hasSelection = actLines.length > 0
  const canPreview =
    actConfig.actNumber.trim() &&
    actConfig.customerName.trim() &&
    actConfig.executorName.trim() &&
    hasSelection

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button onClick={onBack} className="text-slate-400 hover:text-white mb-2 flex items-center gap-1">
            <IconBack className="w-4 h-4" />
            Назад к актам
          </button>
          <h1 className="font-display text-2xl font-bold text-white">
            {step === 'config' ? 'Создание акта выполненных работ' : 'Предпросмотр акта'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('config')} className="btn-secondary flex items-center gap-2">
                <IconBack className="w-5 h-5" />
                Назад к настройке
              </button>
              <button onClick={handleDownload} disabled={isGenerating} className="btn-primary flex items-center gap-2">
                <IconDownload className="w-4 h-4" />
                {isGenerating ? 'Генерация...' : 'Скачать PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        {step === 'config' ? (
          <div className="space-y-6">
            <ActConfigStep
              views={views}
              selectedViewId={selectedViewId}
              onViewChange={setSelectedViewId}
              actNumber={actConfig.actNumber}
              actDate={actConfig.actDate}
              executorName={actConfig.executorName}
              executorDetails={actConfig.executorDetails}
              customerName={actConfig.customerName}
              directorName={actConfig.directorName}
              images={images}
              uploadingImage={uploadingImage}
              onActNumberChange={actConfig.setActNumber}
              onActDateChange={actConfig.setActDate}
              onExecutorNameChange={actConfig.setExecutorName}
              onExecutorDetailsChange={actConfig.setExecutorDetails}
              onCustomerNameChange={actConfig.setCustomerName}
              onDirectorNameChange={actConfig.setDirectorName}
              onImageUpload={handleImageUpload}
              onImageDelete={handleImageDelete}
            />
            <ActSelectionStep
              sections={sections}
              selectedSections={selection.selectedSections}
              selectedItems={selection.selectedItems}
              usedItems={usedItems}
              selectedViewId={selectedViewId}
              actLinesCount={actLines.length}
              grandTotal={grandTotal}
              onToggleSection={handleToggleSection}
              onToggleItem={handleToggleItem}
              onSelectAll={handleSelectAll}
              onDeselectAll={selection.deselectAll}
              getItemTotal={getItemTotal}
            />
          </div>
        ) : (
          <ActPreviewStep
            actRef={actRef}
            actNumber={actConfig.actNumber}
            actDate={actConfig.actDate}
            executorName={actConfig.executorName}
            executorDetails={actConfig.executorDetails}
            customerName={actConfig.customerName}
            directorName={actConfig.directorName}
            actLines={actLines}
            grandTotal={grandTotal}
            images={images}
          />
        )}
      </div>

      {/* Footer */}
      {step === 'config' && (
        <div className="flex items-center justify-end mt-6">
          <button
            onClick={() => setStep('preview')}
            disabled={!canPreview}
            className={`btn-primary flex items-center gap-2 ${!canPreview ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <IconEye className="w-5 h-5" />
            Предпросмотр
          </button>
        </div>
      )}
    </div>
  )
}

