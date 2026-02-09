/**
 * Hook for managing act configuration
 * 
 * Handles act form fields and localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '../../../constants/storage'

interface ActConfig {
  executorName: string
  executorDetails: string
  customerName: string
  directorName: string
  serviceName: string
}

/**
 * Hook for managing act configuration
 * 
 * @param projectId - Project ID for localStorage key
 * @returns Act configuration state and setters
 */
export function useActConfig(projectId: string) {
  const [actNumber, setActNumber] = useState('')
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0])
  const [executorName, setExecutorName] = useState('')
  const [executorDetails, setExecutorDetails] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [directorName, setDirectorName] = useState('')
  const [serviceName, setServiceName] = useState('Оказание услуг по комплектации и снабжению')

  // Load saved config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACT_CONFIG(projectId))
      if (saved) {
        const config: Partial<ActConfig> = JSON.parse(saved)
        if (config.executorName) setExecutorName(config.executorName)
        if (config.executorDetails) setExecutorDetails(config.executorDetails)
        if (config.customerName) setCustomerName(config.customerName)
        if (config.directorName) setDirectorName(config.directorName)
        if (config.serviceName) setServiceName(config.serviceName)
      }
    } catch {
      // Ignore parse errors
    }
  }, [projectId])

  // Save config on change
  const saveConfig = useCallback(() => {
    localStorage.setItem(
      STORAGE_KEYS.ACT_CONFIG(projectId),
      JSON.stringify({
        executorName,
        executorDetails,
        customerName,
        directorName,
        serviceName,
      })
    )
  }, [projectId, executorName, executorDetails, customerName, directorName, serviceName])

  useEffect(() => {
    saveConfig()
  }, [saveConfig])

  return {
    actNumber,
    setActNumber,
    actDate,
    setActDate,
    executorName,
    setExecutorName,
    executorDetails,
    setExecutorDetails,
    customerName,
    setCustomerName,
    directorName,
    setDirectorName,
    serviceName,
    setServiceName,
  }
}


