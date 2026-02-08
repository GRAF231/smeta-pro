import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ========== Types ==========

export interface EstimateView {
  id: string
  name: string
  linkToken: string
  password: string
  sortOrder: number
}

export interface ViewItemSettings {
  price: number
  total: number
  visible: boolean
}

export interface ViewSectionSettings {
  visible: boolean
}

export interface EstimateItem {
  id: string
  number: string
  name: string
  unit: string
  quantity: number
  sortOrder: number
  viewSettings: Record<string, ViewItemSettings>  // viewId -> settings
}

export interface EstimateSection {
  id: string
  name: string
  sortOrder: number
  viewSettings: Record<string, ViewSectionSettings>  // viewId -> settings
  items: EstimateItem[]
}

export interface Project {
  id: string
  title: string
  googleSheetId: string
  lastSyncedAt?: string
  createdAt: string
  views: EstimateView[]
}

export interface ProjectWithEstimate extends Project {
  sections: EstimateSection[]
}

export interface EstimateVersion {
  id: string
  versionNumber: number
  name: string | null
  createdAt: string
}

export interface EstimateVersionView {
  id: string
  name: string
  sortOrder: number
}

export interface EstimateVersionWithSections extends EstimateVersion {
  views: EstimateVersionView[]
  sections: EstimateSection[]
}

// Public view types
export interface EstimateData {
  title: string
  viewName?: string
  sections: PublicSection[]
  total: number
  requiresPassword?: boolean
}

export interface PublicSection {
  name: string
  items: PublicViewItem[]
  subtotal: number
}

export interface PublicViewItem {
  number: string
  name: string
  unit: string
  quantity: number
  price: number
  total: number
}

// Keep old Section/ViewItem for compatibility
export type Section = PublicSection
export type ViewItem = PublicViewItem

// Saved acts types
export interface SavedAct {
  id: string
  actNumber: string
  actDate: string
  executorName: string
  customerName: string
  selectionMode: string
  grandTotal: number
  createdAt: string
}

export interface SavedActDetail extends SavedAct {
  executorDetails: string
  directorName: string
  serviceName: string
  items: SavedActItem[]
}

export interface SavedActItem {
  id: string
  itemId: string | null
  sectionId: string | null
  name: string
  unit: string
  quantity: number
  price: number
  total: number
}

export interface UsedItemInfo {
  actId: string
  actNumber: string
  actDate: string
}

export type UsedItemsMap = Record<string, UsedItemInfo[]>

// Projects API
export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getOne: (id: string) => api.get<ProjectWithEstimate>(`/projects/${id}`),
  create: (data: { title: string; googleSheetUrl?: string }) => 
    api.post<ProjectWithEstimate>('/projects', data),
  update: (id: string, data: { title: string; googleSheetUrl?: string }) => 
    api.put<ProjectWithEstimate>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  
  // Sync with Google Sheets
  sync: (id: string) => api.post<{ message: string; syncedAt: string }>(`/projects/${id}/sync`),
  
  // Sections
  addSection: (projectId: string, name: string) => 
    api.post<{ id: string; name: string; items: EstimateItem[] }>(`/projects/${projectId}/sections`, { name }),
  updateSection: (projectId: string, sectionId: string, data: { name: string }) =>
    api.put(`/projects/${projectId}/sections/${sectionId}`, data),
  deleteSection: (projectId: string, sectionId: string) =>
    api.delete(`/projects/${projectId}/sections/${sectionId}`),
  
  // Items
  addItem: (projectId: string, data: { sectionId: string; name: string; unit: string; quantity: number }) =>
    api.post<{ id: string; name: string; unit: string; quantity: number; sortOrder: number }>(`/projects/${projectId}/items`, data),
  updateItem: (projectId: string, itemId: string, data: { name: string; unit: string; quantity: number }) =>
    api.put(`/projects/${projectId}/items/${itemId}`, data),
  deleteItem: (projectId: string, itemId: string) =>
    api.delete(`/projects/${projectId}/items/${itemId}`),

  // Views
  getViews: (projectId: string) =>
    api.get<EstimateView[]>(`/projects/${projectId}/views`),
  createView: (projectId: string, name: string) =>
    api.post<EstimateView>(`/projects/${projectId}/views`, { name }),
  updateView: (projectId: string, viewId: string, data: { name?: string; password?: string }) =>
    api.put<EstimateView>(`/projects/${projectId}/views/${viewId}`, data),
  duplicateView: (projectId: string, viewId: string) =>
    api.post<EstimateView>(`/projects/${projectId}/views/${viewId}/duplicate`),
  deleteView: (projectId: string, viewId: string) =>
    api.delete(`/projects/${projectId}/views/${viewId}`),

  // View section/item settings
  updateViewSectionSetting: (projectId: string, viewId: string, sectionId: string, data: { visible: boolean }) =>
    api.put(`/projects/${projectId}/views/${viewId}/sections/${sectionId}`, data),
  updateViewItemSetting: (projectId: string, viewId: string, itemId: string, data: { price?: number; visible?: boolean }) =>
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
  getVersions: (projectId: string) =>
    api.get<EstimateVersion[]>(`/projects/${projectId}/versions`),
  createVersion: (projectId: string, name?: string) =>
    api.post<EstimateVersion>(`/projects/${projectId}/versions`, { name }),
  getVersion: (projectId: string, versionId: string) =>
    api.get<EstimateVersionWithSections>(`/projects/${projectId}/versions/${versionId}`),
  restoreVersion: (projectId: string, versionId: string) =>
    api.post<{ message: string; restoredFrom: { versionNumber: number; name: string | null } }>(
      `/projects/${projectId}/versions/${versionId}/restore`
    ),

  // Act images
  getActImages: (projectId: string) =>
    api.get<Record<string, string>>(`/projects/${projectId}/act-images`),
  uploadActImage: (projectId: string, imageType: 'logo' | 'stamp' | 'signature', data: string) =>
    api.post<{ success: boolean; imageType: string }>(`/projects/${projectId}/act-images`, { imageType, data }),
  deleteActImage: (projectId: string, imageType: 'logo' | 'stamp' | 'signature') =>
    api.delete(`/projects/${projectId}/act-images/${imageType}`),

  // Saved Acts
  getActs: (projectId: string) =>
    api.get<SavedAct[]>(`/projects/${projectId}/acts`),
  getAct: (projectId: string, actId: string) =>
    api.get<SavedActDetail>(`/projects/${projectId}/acts/${actId}`),
  saveAct: (projectId: string, data: {
    viewId?: string
    actNumber: string
    actDate: string
    executorName: string
    executorDetails: string
    customerName: string
    directorName: string
    serviceName: string
    selectionMode: string
    grandTotal: number
    items: { itemId?: string; sectionId?: string; name: string; unit: string; quantity: number; price: number; total: number }[]
  }) => api.post<{ id: string; actNumber: string; actDate: string; grandTotal: number; createdAt: string }>(
    `/projects/${projectId}/acts`, data
  ),
  deleteAct: (projectId: string, actId: string) =>
    api.delete(`/projects/${projectId}/acts/${actId}`),
  getUsedItems: (projectId: string) =>
    api.get<UsedItemsMap>(`/projects/${projectId}/acts/used-items`),

  // AI Generation from PDF
  generateFromPdf: (formData: FormData) =>
    api.post<ProjectWithEstimate>('/projects/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 360000,
    }),
}

// Materials
export interface Material {
  id: string
  estimateId: string
  name: string
  article: string
  brand: string
  unit: string
  price: number
  quantity: number
  total: number
  url: string
  description: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface MaterialRefreshResult {
  message: string
  updated: number
  materials: Material[]
}

export const materialsApi = {
  getAll: (projectId: string) =>
    api.get<Material[]>(`/projects/${projectId}/materials`),

  parse: (projectId: string, urls: string[]) =>
    api.post<Material[]>(`/projects/${projectId}/materials/parse`, { urls }, {
      timeout: 300000,
    }),

  update: (projectId: string, materialId: string, data: Partial<Material>) =>
    api.put<Material>(`/projects/${projectId}/materials/${materialId}`, data),

  delete: (projectId: string, materialId: string) =>
    api.delete(`/projects/${projectId}/materials/${materialId}`),

  refreshAll: (projectId: string) =>
    api.post<MaterialRefreshResult>(`/projects/${projectId}/materials/refresh`, {}, {
      timeout: 300000,
    }),

  refreshOne: (projectId: string, materialId: string) =>
    api.post<Material>(`/projects/${projectId}/materials/refresh/${materialId}`, {}, {
      timeout: 60000,
    }),
}
