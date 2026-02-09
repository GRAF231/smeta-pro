/**
 * Hook for managing section editing and creation state
 * 
 * Handles state for section management including:
 * - Adding new sections (form visibility and name)
 * - Editing section names
 * - Loading states for section operations
 * 
 * @returns Object containing:
 * - `showAddSection` - Whether add section form is visible
 * - `newSectionName` - Name for new section being created
 * - `isAddingSection` - Loading state for adding section
 * - `editingSectionId` - Section ID being edited (null if not editing)
 * - `editingSectionName` - New name for section being edited
 * - `setShowAddSection` - Function to show/hide add section form
 * - `setNewSectionName` - Function to set new section name
 * - `setIsAddingSection` - Function to set adding state
 * - `setEditingSectionId` - Function to set editing section ID
 * - `setEditingSectionName` - Function to set editing section name
 * 
 * @example
 * ```tsx
 * const {
 *   showAddSection,
 *   newSectionName,
 *   setShowAddSection,
 *   setNewSectionName,
 * } = useEstimateSections()
 * 
 * const handleAddClick = () => {
 *   setShowAddSection(true)
 *   setNewSectionName('')
 * }
 * ```
 */

import { useState } from 'react'
import type { SectionId } from '../../../types'

export interface UseEstimateSectionsResult {
  showAddSection: boolean
  newSectionName: string
  isAddingSection: boolean
  editingSectionId: SectionId | null
  editingSectionName: string
  setShowAddSection: (show: boolean) => void
  setNewSectionName: (name: string) => void
  setIsAddingSection: (adding: boolean) => void
  setEditingSectionId: (id: SectionId | null) => void
  setEditingSectionName: (name: string) => void
}

export function useEstimateSections(): UseEstimateSectionsResult {
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<SectionId | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')

  return {
    showAddSection,
    newSectionName,
    isAddingSection,
    editingSectionId,
    editingSectionName,
    setShowAddSection,
    setNewSectionName,
    setIsAddingSection,
    setEditingSectionId,
    setEditingSectionName,
  }
}

