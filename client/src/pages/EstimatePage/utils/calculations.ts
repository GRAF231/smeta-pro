/**
 * Calculation utilities for EstimatePage
 * 
 * Contains functions for calculating totals and other derived values.
 */

import type { ProjectWithEstimate } from '../../../types'

/**
 * Calculate totals for all views
 * 
 * @param project - Project with estimate data
 * @returns Record mapping view IDs to their totals
 */
export function calculateTotals(project: ProjectWithEstimate | null): Record<string, number> {
  const totals: Record<string, number> = {}
  if (!project) return totals

  for (const view of project.views) {
    let viewTotal = 0
    project.sections.forEach(section => {
      const sectionVisible = section.viewSettings[view.id]?.visible ?? true
      if (sectionVisible) {
        section.items.forEach(item => {
          const itemSettings = item.viewSettings[view.id]
          if (itemSettings?.visible) {
            viewTotal += itemSettings.total
          }
        })
      }
    })
    totals[view.id] = viewTotal
  }

  return totals
}



