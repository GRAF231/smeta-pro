/**
 * Hook for loading used items from previous acts
 * 
 * Loads information about which items were already used in previous acts.
 */

import { useState, useEffect } from 'react'
import { projectsApi } from '../../../services/api'
import type { UsedItemsMap, ProjectId } from '../../../types'

/**
 * Hook for loading used items
 * 
 * @param projectId - Project ID
 * @returns Used items map and reload function
 */
export function useUsedItems(projectId: ProjectId) {
  const [usedItems, setUsedItems] = useState<UsedItemsMap>({})

  const loadUsedItems = async () => {
    try {
      const res = await projectsApi.getUsedItems(projectId)
      setUsedItems(res.data)
    } catch {
      // Ignore errors
    }
  }

  useEffect(() => {
    loadUsedItems()
  }, [projectId])

  return {
    usedItems,
    reloadUsedItems: loadUsedItems,
  }
}

