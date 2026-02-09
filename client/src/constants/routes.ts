/**
 * Application route constants
 * 
 * Centralized route definitions for the application.
 * Includes both static routes and route factory functions.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  
  PROJECTS: {
    NEW: '/projects/new',
    GENERATE: '/projects/generate',
    EDIT: (id: string) => `/projects/${id}/edit`,
    ESTIMATE: (id: string) => `/projects/${id}/estimate`,
    ACTS: (id: string) => `/projects/${id}/acts`,
    ACT: (id: string) => `/projects/${id}/act`,
    MATERIALS: (id: string) => `/projects/${id}/materials`,
  },
  
  PUBLIC_VIEW: (token: string) => `/v/${token}`,
  
  // Legacy routes (for backward compatibility)
  LEGACY_CUSTOMER: (token: string) => `/c/${token}`,
  LEGACY_MASTER: (token: string) => `/m/${token}`,
} as const

