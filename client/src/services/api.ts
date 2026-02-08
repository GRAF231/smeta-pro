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

// ========== Project (formerly Estimate) ==========

export interface Project {
  id: string
  title: string
  googleSheetId: string  // может быть пустой строкой если проект без таблицы
  customerLinkToken: string
  masterLinkToken: string
  masterPassword?: string
  lastSyncedAt?: string
  createdAt: string
}

export interface EstimateItem {
  id: string
  number: string
  name: string
  unit: string
  quantity: number
  customerPrice: number
  customerTotal: number
  masterPrice: number
  masterTotal: number
  sortOrder: number
  showCustomer: boolean
  showMaster: boolean
}

export interface EstimateSection {
  id: string
  name: string
  sortOrder: number
  showCustomer: boolean
  showMaster: boolean
  items: EstimateItem[]
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

export interface EstimateVersionWithSections extends EstimateVersion {
  sections: EstimateSection[]
}

export interface EstimateData {
  title: string
  sections: Section[]
  total: number
  requiresPassword?: boolean
}

export interface Section {
  name: string
  items: ViewItem[]
  subtotal: number
}

export interface ViewItem {
  number: string
  name: string
  unit: string
  quantity: number
  price: number
  total: number
}

// Projects API
export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getOne: (id: string) => api.get<ProjectWithEstimate>(`/projects/${id}`),
  create: (data: { title: string; googleSheetUrl?: string }) => 
    api.post<Project>('/projects', data),
  update: (id: string, data: { title: string; googleSheetUrl?: string }) => 
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  
  // Sync with Google Sheets
  sync: (id: string) => api.post<{ message: string; syncedAt: string }>(`/projects/${id}/sync`),
  
  // Sections
  addSection: (projectId: string, name: string) => 
    api.post<EstimateSection>(`/projects/${projectId}/sections`, { name }),
  updateSection: (projectId: string, sectionId: string, data: { name: string; showCustomer: boolean; showMaster: boolean }) =>
    api.put(`/projects/${projectId}/sections/${sectionId}`, data),
  deleteSection: (projectId: string, sectionId: string) =>
    api.delete(`/projects/${projectId}/sections/${sectionId}`),
  
  // Items
  addItem: (projectId: string, data: { sectionId: string; name: string; unit: string; quantity: number; customerPrice: number; masterPrice: number }) =>
    api.post<EstimateItem>(`/projects/${projectId}/items`, data),
  updateItem: (projectId: string, itemId: string, data: Partial<EstimateItem>) =>
    api.put(`/projects/${projectId}/items/${itemId}`, data),
  deleteItem: (projectId: string, itemId: string) =>
    api.delete(`/projects/${projectId}/items/${itemId}`),
  
  // Public views
  getCustomerView: (token: string) => 
    api.get<EstimateData>(`/projects/customer/${token}`),
  getMasterView: (token: string) => 
    api.get<EstimateData>(`/projects/master/${token}`),
  verifyMasterPassword: (token: string, password: string) =>
    api.post<EstimateData>(`/projects/master/${token}/verify`, { password }),
  
  // Master password
  setMasterPassword: (projectId: string, password: string) =>
    api.put<{ success: boolean; masterPassword: string }>(`/projects/${projectId}/master-password`, { password }),
  
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

  // AI Generation from PDF
  generateFromPdf: (formData: FormData) =>
    api.post<Project>('/projects/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 360000, // 6 minutes for large PDF AI generation
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
      timeout: 300000, // 5 minutes for AI parsing
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
