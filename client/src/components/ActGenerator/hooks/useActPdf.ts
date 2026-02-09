/**
 * Hook for PDF generation and act saving
 * 
 * Handles PDF generation and saving act to database.
 */

import { useState, useRef } from 'react'
import { projectsApi } from '../../../services/api'
import { renderToPdf } from '../../../utils/pdfGenerator'
import { useErrorHandler } from '../../../hooks/useErrorHandler'
import type { EstimateSection, ProjectId, ViewId, SectionId, ItemId } from '../../../types'
import { asSectionId, asItemId } from '../../../types'

interface ActLine {
  number: number
  name: string
  quantity: number
  unit: string
  price: number
  total: number
}

interface UseActPdfProps {
  projectId: ProjectId
  selectedViewId: ViewId | null
  selectionMode: 'sections' | 'items'
  selectedSections: Set<SectionId>
  selectedItems: Set<ItemId>
  sections: EstimateSection[]
  actLines: ActLine[]
  actNumber: string
  actDate: string
  executorName: string
  executorDetails: string
  customerName: string
  directorName: string
  serviceName: string
  getItemPrice: (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }) => number
  getItemTotal: (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }) => number
  onUsedItemsReload: () => void
}

/**
 * Hook for PDF generation and act saving
 * 
 * @param props - PDF generation dependencies
 * @returns PDF generation state and handler
 */
export function useActPdf({
  projectId,
  selectedViewId,
  selectionMode,
  selectedSections,
  selectedItems,
  sections,
  actLines,
  actNumber,
  actDate,
  executorName,
  executorDetails,
  customerName,
  directorName,
  serviceName,
  getItemPrice,
  getItemTotal,
  onUsedItemsReload,
}: UseActPdfProps) {
  const actRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { handleError } = useErrorHandler()

  /**
   * Generate and download PDF, then save act to database
   */
  const handleDownload = async () => {
    if (!actRef.current) return
    setIsGenerating(true)
    try {
      await renderToPdf(actRef.current, `Акт_${actNumber || 'б-н'}_${actDate}.pdf`)

      // Save act to database
      try {
        const actItemsToSave: Array<{
          itemId?: ItemId
          sectionId?: SectionId
          name: string
          unit: string
          quantity: number
          price: number
          total: number
        }> = []

        if (selectionMode === 'sections') {
          sections.forEach(section => {
            if (!selectedSections.has(asSectionId(section.id))) return
            const selectedSectionItems = section.items.filter(item => selectedItems.has(asItemId(item.id)))
            const sectionTotal = selectedSectionItems.reduce((sum, item) => sum + getItemTotal(item), 0)
            if (sectionTotal > 0) {
              actItemsToSave.push({
                sectionId: asSectionId(section.id),
                name: section.name,
                unit: '-',
                quantity: 1,
                price: sectionTotal,
                total: sectionTotal,
              })
              selectedSectionItems.forEach(item => {
                actItemsToSave.push({
                  itemId: asItemId(item.id),
                  sectionId: asSectionId(section.id),
                  name: item.name,
                  unit: item.unit || '-',
                  quantity: item.quantity,
                  price: getItemPrice(item),
                  total: getItemTotal(item),
                })
              })
            }
          })
        } else {
          sections.forEach(section => {
            section.items.forEach(item => {
              if (!selectedItems.has(asItemId(item.id))) return
              actItemsToSave.push({
                itemId: asItemId(item.id),
                sectionId: asSectionId(section.id),
                name: item.name,
                unit: item.unit || '-',
                quantity: item.quantity,
                price: getItemPrice(item),
                total: getItemTotal(item),
              })
            })
          })
        }

        const grandTotal = actLines.reduce((sum, line) => sum + line.total, 0)

        await projectsApi.saveAct(projectId, {
          viewId: selectedViewId || undefined,
          actNumber,
          actDate,
          executorName,
          executorDetails,
          customerName,
          directorName,
          serviceName,
          selectionMode,
          grandTotal,
          items: actItemsToSave,
        })
        await onUsedItemsReload()
      } catch (saveErr) {
        console.error('Act save error:', saveErr)
      }
    } catch (err) {
      handleError(err, 'Ошибка при создании PDF. Попробуйте ещё раз.')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    actRef,
    isGenerating,
    handleDownload,
  }
}

