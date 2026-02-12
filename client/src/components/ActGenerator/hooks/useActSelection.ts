/**
 * Hook for managing act item selection
 * 
 * Handles selection of sections and items for the act.
 */

import { useState } from 'react'
import type { EstimateSection } from '../../../types'

/**
 * Hook for managing act item selection
 * 
 * @returns Selection state and handlers
 */
export function useActSelection() {
  const [selectionMode, setSelectionMode] = useState<'sections' | 'items'>('sections')
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  /**
   * Toggle section selection
   */
  const toggleSection = (sectionId: string, section: EstimateSection | undefined) => {
    const next = new Set(selectedSections)
    if (next.has(sectionId)) {
      next.delete(sectionId)
      if (section) {
        const nextItems = new Set(selectedItems)
        section.items.forEach(item => nextItems.delete(item.id))
        setSelectedItems(nextItems)
      }
    } else {
      next.add(sectionId)
      if (section) {
        const nextItems = new Set(selectedItems)
        section.items.forEach(item => nextItems.add(item.id))
        setSelectedItems(nextItems)
      }
    }
    setSelectedSections(next)
  }

  /**
   * Toggle item selection
   */
  const toggleItem = (sectionId: string, itemId: string, section: EstimateSection | undefined) => {
    const next = new Set(selectedItems)
    if (next.has(itemId)) {
      next.delete(itemId)
    } else {
      next.add(itemId)
    }
    setSelectedItems(next)

    if (section) {
      const nextSections = new Set(selectedSections)
      const allSelected = section.items.every(i => next.has(i.id))
      const anySelected = section.items.some(i => next.has(i.id))
      if (allSelected && section.items.length > 0) {
        nextSections.add(sectionId)
      } else if (!anySelected) {
        nextSections.delete(sectionId)
      }
      setSelectedSections(nextSections)
    }
  }

  /**
   * Select all sections and items
   */
  const selectAll = (sections: EstimateSection[]) => {
    setSelectedSections(new Set(sections.map(s => s.id)))
    setSelectedItems(new Set(sections.flatMap(s => s.items.map(i => i.id))))
  }

  /**
   * Deselect all sections and items
   */
  const deselectAll = () => {
    setSelectedSections(new Set())
    setSelectedItems(new Set())
  }

  return {
    selectionMode,
    setSelectionMode,
    selectedSections,
    selectedItems,
    toggleSection,
    toggleItem,
    selectAll,
    deselectAll,
  }
}




