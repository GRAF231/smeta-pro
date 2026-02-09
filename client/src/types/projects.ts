/**
 * Project-related types
 */

import type { EstimateView, EstimateSection } from './estimates'

/**
 * Project entity
 * 
 * Represents a project with basic information and associated views.
 * Does not include estimate sections/items (use ProjectWithEstimate for that).
 */
export interface Project {
  /** Unique project identifier */
  id: string
  /** Project title/name */
  title: string
  /** Google Sheets document ID */
  googleSheetId: string
  /** Last synchronization timestamp with Google Sheets (ISO string) */
  lastSyncedAt?: string
  /** Project creation timestamp (ISO string) */
  createdAt: string
  /** Array of estimate views associated with this project */
  views: EstimateView[]
}

/**
 * Project with full estimate data (sections and items)
 * 
 * Extends Project with complete estimate structure including
 * all sections and their items. Used when full estimate data is needed.
 */
export interface ProjectWithEstimate extends Project {
  /** Array of estimate sections, each containing items */
  sections: EstimateSection[]
}

