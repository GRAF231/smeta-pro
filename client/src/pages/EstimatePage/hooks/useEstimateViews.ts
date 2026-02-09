/**
 * Hook for managing view selection and version modal state
 * 
 * Handles state for estimate views including:
 * - Active view selection
 * - Version modal visibility
 * 
 * @param initialViewId - Initial view ID to select (optional)
 * @param onViewChange - Callback when view changes (optional)
 * @returns Object containing:
 * - `activeViewId` - Currently active view ID (null if none selected)
 * - `showVersionModal` - Whether version modal is visible
 * - `setActiveViewId` - Function to set active view ID
 * - `setShowVersionModal` - Function to show/hide version modal
 * 
 * @example
 * ```tsx
 * const { activeViewId, setActiveViewId, showVersionModal, setShowVersionModal } = useEstimateViews()
 * 
 * const handleViewSelect = (viewId: ViewId) => {
 *   setActiveViewId(viewId)
 * }
 * ```
 */

import { useState, useEffect } from 'react'
import type { ViewId } from '../../../types'
import { asViewId } from '../../../types'

export interface UseEstimateViewsResult {
  activeViewId: ViewId | null
  showVersionModal: boolean
  setActiveViewId: (id: ViewId | null) => void
  setShowVersionModal: (show: boolean) => void
}

export interface UseEstimateViewsOptions {
  initialViewId?: ViewId | null
  views?: Array<{ id: string }>
  onViewChange?: (viewId: ViewId | null) => void
}

export function useEstimateViews(
  options: UseEstimateViewsOptions = {}
): UseEstimateViewsResult {
  const { initialViewId, views, onViewChange } = options
  const [activeViewId, setActiveViewIdState] = useState<ViewId | null>(initialViewId || null)
  const [showVersionModal, setShowVersionModal] = useState(false)

  // Set initial view from views array if available
  useEffect(() => {
    if (!activeViewId && views && views.length > 0) {
      const firstViewId = asViewId(views[0].id)
      setActiveViewIdState(firstViewId)
      if (onViewChange) {
        onViewChange(firstViewId)
      }
    }
  }, [views, activeViewId, onViewChange])

  const setActiveViewId = (id: ViewId | null) => {
    setActiveViewIdState(id)
    if (onViewChange) {
      onViewChange(id)
    }
  }

  return {
    activeViewId,
    showVersionModal,
    setActiveViewId,
    setShowVersionModal,
  }
}

