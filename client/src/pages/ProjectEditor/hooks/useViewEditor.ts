import { useState, useRef } from 'react'
import type { EstimateView, ViewId } from '../../../types'
import { asViewId } from '../../../types'

/**
 * Hook for managing view editing state and operations
 * 
 * Handles the state for editing a single view including:
 * - Which view is being edited
 * - Editing form values (name, password)
 * - Saving state and success feedback
 * 
 * @returns Object containing:
 * - `editingViewId` - Currently editing view ID (null if none)
 * - `editingViewName` - Current name value
 * - `editingViewPassword` - Current password value
 * - `isSavingView` - Saving state flag
 * - `savedViewId` - Recently saved view ID (for success feedback)
 * - `startEditingView` - Function to start editing a view
 * - `cancelEditingView` - Function to cancel editing
 * - `setEditingViewName` - Function to update name value
 * - `setEditingViewPassword` - Function to update password value
 * - `setIsSavingView` - Function to set saving state
 * - `setSavedViewId` - Function to set saved view ID
 * - `clearSavedViewId` - Function to clear saved view ID after timeout
 */
export function useViewEditor() {
  const [editingViewId, setEditingViewId] = useState<ViewId | null>(null)
  const [editingViewName, setEditingViewName] = useState('')
  const [editingViewPassword, setEditingViewPassword] = useState('')
  const [isSavingView, setIsSavingView] = useState(false)
  const [savedViewId, setSavedViewId] = useState<ViewId | null>(null)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const startEditingView = (view: EstimateView) => {
    setEditingViewId(asViewId(view.id))
    setEditingViewName(view.name)
    setEditingViewPassword(view.password || '')
  }

  const cancelEditingView = () => {
    setEditingViewId(null)
    setEditingViewName('')
    setEditingViewPassword('')
  }

  const clearSavedViewId = () => {
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    savedTimeoutRef.current = setTimeout(() => setSavedViewId(null), 2000)
  }

  return {
    editingViewId,
    editingViewName,
    editingViewPassword,
    isSavingView,
    savedViewId,
    startEditingView,
    cancelEditingView,
    setEditingViewName,
    setEditingViewPassword,
    setIsSavingView,
    setSavedViewId,
    clearSavedViewId,
  }
}

