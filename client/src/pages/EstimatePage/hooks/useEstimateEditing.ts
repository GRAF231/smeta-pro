/**
 * Hook for managing item editing state
 * 
 * Handles state for editing estimate items including:
 * - Currently editing item ID
 * - Editing form data (name, unit, quantity, price)
 * - New item section selection
 * 
 * @returns Object containing:
 * - `editingItem` - Currently editing item ID (null if not editing)
 * - `editingData` - Form data for editing (name, unit, quantity, price)
 * - `newItemSection` - Section ID where new item will be added (null if not adding)
 * - `setEditingItem` - Function to set editing item ID
 * - `setEditingData` - Function to update editing form data
 * - `setNewItemSection` - Function to set section for new item
 * 
 * @example
 * ```tsx
 * const { editingItem, editingData, setEditingItem, setEditingData } = useEstimateEditing()
 * 
 * const startEdit = (item: EstimateItem) => {
 *   setEditingItem(item.id)
 *   setEditingData({ name: item.name, unit: item.unit, quantity: item.quantity })
 * }
 * ```
 */

import { useState } from 'react'
import type { ItemId, SectionId } from '../../../types'

export interface UseEstimateEditingResult {
  editingItem: ItemId | null
  editingData: { name?: string; unit?: string; quantity?: number; price?: number }
  newItemSection: SectionId | null
  setEditingItem: (id: ItemId | null) => void
  setEditingData: (data: { name?: string; unit?: string; quantity?: number; price?: number }) => void
  setNewItemSection: (id: SectionId | null) => void
}

export function useEstimateEditing(): UseEstimateEditingResult {
  const [editingItem, setEditingItem] = useState<ItemId | null>(null)
  const [editingData, setEditingData] = useState<{ name?: string; unit?: string; quantity?: number; price?: number }>({})
  const [newItemSection, setNewItemSection] = useState<SectionId | null>(null)

  return {
    editingItem,
    editingData,
    newItemSection,
    setEditingItem,
    setEditingData,
    setNewItemSection,
  }
}

