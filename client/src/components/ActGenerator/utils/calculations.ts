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
 * Always creates individual lines for each item, even when sections are selected.
 * 
 * @param sections - All sections
 * @param selectionMode - Selection mode ('sections' or 'items') - kept for backward compatibility but not used
 * @param selectedSections - Set of selected section IDs
 * @param selectedItems - Set of selected item IDs
 * @param getItemPrice - Function to get item price
 * @param getItemTotal - Function to get item total
 * @returns Array of act lines
 */
export function calculateActLines(
  sections: EstimateSection[],
  _selectionMode: 'sections' | 'items',
  _selectedSections: Set<string>,
  selectedItems: Set<string>,
  getItemPrice: GetItemPriceFn,
  getItemTotal: GetItemTotalFn
): ActLine[] {
  const lines: ActLine[] = []
  let num = 1

  // Always create individual lines for each selected item
  // When a section is selected, all items from that section are added to selectedItems
  // So we just need to check if the item is in selectedItems
  sections.forEach(section => {
    section.items.forEach(item => {
      if (selectedItems.has(item.id)) {
        lines.push({
          number: num++,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || '-',
          price: getItemPrice(item),
          total: getItemTotal(item),
        })
      }
    })
  })

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




