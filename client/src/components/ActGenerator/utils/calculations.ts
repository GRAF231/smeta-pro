/**
 * Calculation utilities for ActGenerator
 * 
 * Contains functions for calculating act lines and totals.
 */

import type { EstimateSection } from '../../../types'
import type { ActLine } from '../ActDocumentTemplate'

interface GetItemPriceFn {
  (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }): number
}

interface GetItemTotalFn {
  (item: { viewSettings: Record<string, { price: number; total: number; visible: boolean }> }): number
}

/**
 * Calculate act line items from selected sections/items
 * 
 * @param sections - All sections
 * @param selectionMode - Selection mode ('sections' or 'items')
 * @param selectedSections - Set of selected section IDs
 * @param selectedItems - Set of selected item IDs
 * @param getItemPrice - Function to get item price
 * @param getItemTotal - Function to get item total
 * @returns Array of act lines
 */
export function calculateActLines(
  sections: EstimateSection[],
  selectionMode: 'sections' | 'items',
  selectedSections: Set<string>,
  selectedItems: Set<string>,
  getItemPrice: GetItemPriceFn,
  getItemTotal: GetItemTotalFn
): ActLine[] {
  const lines: ActLine[] = []
  let num = 1

  if (selectionMode === 'sections') {
    sections.forEach(section => {
      if (!selectedSections.has(section.id)) return
      const selectedSectionItems = section.items.filter(item => selectedItems.has(item.id))
      const sectionTotal = selectedSectionItems.reduce((sum, item) => sum + getItemTotal(item), 0)
      if (sectionTotal > 0) {
        lines.push({
          number: num++,
          name: section.name,
          quantity: 1,
          unit: '-',
          price: sectionTotal,
          total: sectionTotal,
        })
      }
    })
  } else {
    sections.forEach(section => {
      section.items.forEach(item => {
        if (!selectedItems.has(item.id)) return
        lines.push({
          number: num++,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || '-',
          price: getItemPrice(item),
          total: getItemTotal(item),
        })
      })
    })
  }

  return lines
}

/**
 * Calculate grand total from act lines
 * 
 * @param actLines - Array of act lines
 * @returns Grand total
 */
export function calculateGrandTotal(actLines: ActLine[]): number {
  return actLines.reduce((sum, line) => sum + line.total, 0)
}


