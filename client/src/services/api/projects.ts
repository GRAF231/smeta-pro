/**
 * Projects API methods
 */

import { api } from './base'
import type {
  Project,
  ProjectWithEstimate,
  EstimateView,
  EstimateItem,
  EstimateData,
  EstimateVersion,
  EstimateVersionWithSections,
  SavedAct,
  SavedActDetail,
  UsedItemsMap,
  ProjectId,
  ViewId,
  SectionId,
  ItemId,
  ActId,
  VersionId,
} from '../../types'

/**
 * Projects API client
 * 
 * Provides methods for all project-related API operations including:
 * - CRUD operations for projects
 * - Google Sheets synchronization
 * - Sections and items management
 * - Estimate views management
 * - Version management
 * - Act images and saved acts
 * - AI generation from PDF
 * 
 * All methods return axios promises with typed responses.
 */
export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getOne: (id: ProjectId) => api.get<ProjectWithEstimate>(`/projects/${id}`),
  create: (data: { title: string; googleSheetUrl?: string }) => 
    api.post<ProjectWithEstimate>('/projects', data),
  update: (id: ProjectId, data: { title: string; googleSheetUrl?: string }) => 
    api.put<ProjectWithEstimate>(`/projects/${id}`, data),
  delete: (id: ProjectId) => api.delete(`/projects/${id}`),
  
  // Sync with Google Sheets
  sync: (id: ProjectId) => api.post<{ message: string; syncedAt: string }>(`/projects/${id}/sync`),
  
  // Sections
  addSection: (projectId: ProjectId, name: string) => 
    api.post<{ id: string; name: string; items: EstimateItem[] }>(`/projects/${projectId}/sections`, { name }),
  updateSection: (projectId: ProjectId, sectionId: SectionId, data: { name: string }) =>
    api.put(`/projects/${projectId}/sections/${sectionId}`, data),
  deleteSection: (projectId: ProjectId, sectionId: SectionId) =>
    api.delete(`/projects/${projectId}/sections/${sectionId}`),
  
  // Items
  addItem: (projectId: ProjectId, data: { sectionId: SectionId; name: string; unit: string; quantity: number }) =>
    api.post<{ id: string; name: string; unit: string; quantity: number; sortOrder: number }>(`/projects/${projectId}/items`, data),
  updateItem: (projectId: ProjectId, itemId: ItemId, data: { name: string; unit: string; quantity: number }) =>
    api.put(`/projects/${projectId}/items/${itemId}`, data),
  deleteItem: (projectId: ProjectId, itemId: ItemId) =>
    api.delete(`/projects/${projectId}/items/${itemId}`),

  // Views
  getViews: (projectId: ProjectId) =>
    api.get<EstimateView[]>(`/projects/${projectId}/views`),
  createView: (projectId: ProjectId, name: string) =>
    api.post<EstimateView>(`/projects/${projectId}/views`, { name }),
  updateView: (projectId: ProjectId, viewId: ViewId, data: { name?: string; password?: string }) =>
    api.put<EstimateView>(`/projects/${projectId}/views/${viewId}`, data),
  duplicateView: (projectId: ProjectId, viewId: ViewId) =>
    api.post<EstimateView>(`/projects/${projectId}/views/${viewId}/duplicate`),
  deleteView: (projectId: ProjectId, viewId: ViewId) =>
    api.delete(`/projects/${projectId}/views/${viewId}`),

  // View section/item settings
  updateViewSectionSetting: (projectId: ProjectId, viewId: ViewId, sectionId: SectionId, data: { visible: boolean }) =>
    api.put(`/projects/${projectId}/views/${viewId}/sections/${sectionId}`, data),
  updateViewItemSetting: (projectId: ProjectId, viewId: ViewId, itemId: ItemId, data: { price?: number; visible?: boolean }) =>
    api.put<{ price: number; total: number; visible: boolean }>(`/projects/${projectId}/views/${viewId}/items/${itemId}`, data),
  
  // Public views
  getPublicView: (token: string) => 
    api.get<EstimateData>(`/projects/view/${token}`),
  verifyPublicView: (token: string, password: string) =>
    api.post<EstimateData>(`/projects/view/${token}/verify`, { password }),
  // Legacy
  getCustomerView: (token: string) => 
    api.get<EstimateData>(`/projects/customer/${token}`),
  getMasterView: (token: string) => 
    api.get<EstimateData>(`/projects/master/${token}`),
  verifyMasterPassword: (token: string, password: string) =>
    api.post<EstimateData>(`/projects/master/${token}/verify`, { password }),
  
  // Versions
  getVersions: (projectId: ProjectId) =>
    api.get<EstimateVersion[]>(`/projects/${projectId}/versions`),
  createVersion: (projectId: ProjectId, name?: string) =>
    api.post<EstimateVersion>(`/projects/${projectId}/versions`, { name }),
  getVersion: (projectId: ProjectId, versionId: VersionId) =>
    api.get<EstimateVersionWithSections>(`/projects/${projectId}/versions/${versionId}`),
  restoreVersion: (projectId: ProjectId, versionId: VersionId) =>
    api.post<{ message: string; restoredFrom: { versionNumber: number; name: string | null } }>(
      `/projects/${projectId}/versions/${versionId}/restore`
    ),

  // Act images
  getActImages: (projectId: ProjectId) =>
    api.get<Record<string, string>>(`/projects/${projectId}/act-images`),
  uploadActImage: (projectId: ProjectId, imageType: 'logo' | 'stamp' | 'signature', data: string) =>
    api.post<{ success: boolean; imageType: string }>(`/projects/${projectId}/act-images`, { imageType, data }),
  deleteActImage: (projectId: ProjectId, imageType: 'logo' | 'stamp' | 'signature') =>
    api.delete(`/projects/${projectId}/act-images/${imageType}`),

  // Saved Acts
  getActs: (projectId: ProjectId) =>
    api.get<SavedAct[]>(`/projects/${projectId}/acts`),
  getAct: (projectId: ProjectId, actId: ActId) =>
    api.get<SavedActDetail>(`/projects/${projectId}/acts/${actId}`),
  saveAct: (projectId: ProjectId, data: {
    viewId?: ViewId
    actNumber: string
    actDate: string
    executorName: string
    executorDetails: string
    customerName: string
    directorName: string
    serviceName: string
    selectionMode: string
    grandTotal: number
    items: { itemId?: ItemId; sectionId?: SectionId; name: string; unit: string; quantity: number; price: number; total: number }[]
  }) => api.post<{ id: string; actNumber: string; actDate: string; grandTotal: number; createdAt: string }>(
    `/projects/${projectId}/acts`, data
  ),
  deleteAct: (projectId: ProjectId, actId: ActId) =>
    api.delete(`/projects/${projectId}/acts/${actId}`),
  getUsedItems: (projectId: ProjectId) =>
    api.get<UsedItemsMap>(`/projects/${projectId}/acts/used-items`),

  // AI Generation from PDF
  generateFromPdf: (formData: FormData) =>
    api.post<ProjectWithEstimate>('/projects/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 360000,
    }),
  
  // Test Page Classification
  testPageClassification: (formData: FormData) =>
    api.post<{
      taskId: string
      totalPages: number
      classifications: Array<{
        pageNumber: number
        pageType: 'plan' | 'wall_layout' | 'specification' | 'visualization' | 'other'
        roomName: string | null
      }>
      savedClassifications: Array<{
        id: string
        task_id: string
        page_number: number
        page_type: string
        room_name: string | null
        image_data_url: string | null
        created_at: string
      }>
    }>('/projects/test-classification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    }),
  
  // Test Structure Analysis
  testStructureAnalysis: (formData: FormData) =>
    api.post<{
      taskId: string
      totalPages: number
      titlePagesCount: number
      planPagesCount: number
      structure: {
        totalArea: number | null
        address: string | null
        roomCount: number
        rooms: Array<{
          name: string
          type: string | null
          area: number | null
          planType: 'original' | 'renovated' | 'both'
          source: string
        }>
        planTypes: string[]
      }
      savedRoomData: Array<{
        id: string
        room_name: string
        room_type: string | null
        area: number | null
      }>
      titlePages: string[]
      planPages: string[]
      tableImages: string[]
    }>('/projects/test-structure-analysis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    }),
  
  // Test Room Data Extraction
  testRoomDataExtraction: (formData: FormData) =>
    api.post<{
      taskId: string
      totalPages: number
      roomsProcessed: number
      results: Array<{
        roomName: string
        extractedData: {
          wallMaterials: Array<{
            material: string
            description: string
            area?: number
          }>
          floorMaterial: {
            material: string
            description: string
            area?: number
          } | null
          ceilingMaterial: {
            material: string
            description: string
            area?: number
          } | null
          electrical: {
            outlets: number
            switches: number
            fixtures: number
            locations?: Array<{
              type: 'outlet' | 'switch' | 'fixture'
              description: string
            }>
          }
          openings: Array<{
            type: 'door' | 'window' | 'arch'
            width?: number
            height?: number
            description: string
          }>
          dimensions: {
            length?: number
            width?: number
            height?: number
            area?: number
          }
          notes?: string[]
        }
        savedRoomDataId: string
        highQualityRegionsCount: number
        materialBills: Array<{
          title: string
          roomName?: string
          items: Array<{
            position: number
            name: string
            unit: string
            quantity: number | null
            article?: string
            brand?: string
            manufacturer?: string
            description?: string
          }>
        }>
        materialBillImagesCount: number
      }>
      highQualityRegions: Array<{
        roomName: string
        index: number
        image: string
      }>
      materialBillImages: Array<{
        roomName: string
        index: number
        image: string
      }>
    }>('/projects/test-room-data-extraction', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000, // 10 minutes timeout for room data extraction
    }),
}

