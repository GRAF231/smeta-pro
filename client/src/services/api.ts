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

export interface Estimate {
  id: string
  title: string
  googleSheetId: string
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

export interface EstimateWithSections extends Estimate {
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

// Estimates API
export const estimatesApi = {
  getAll: () => api.get<Estimate[]>('/estimates'),
  getOne: (id: string) => api.get<EstimateWithSections>(`/estimates/${id}`),
  create: (data: { title: string; googleSheetUrl: string }) => 
    api.post<Estimate>('/estimates', data),
  update: (id: string, data: { title: string; googleSheetUrl: string }) => 
    api.put<Estimate>(`/estimates/${id}`, data),
  delete: (id: string) => api.delete(`/estimates/${id}`),
  
  // Sync with Google Sheets
  sync: (id: string) => api.post<{ message: string; syncedAt: string }>(`/estimates/${id}/sync`),
  
  // Sections
  addSection: (estimateId: string, name: string) => 
    api.post<EstimateSection>(`/estimates/${estimateId}/sections`, { name }),
  updateSection: (estimateId: string, sectionId: string, data: { name: string; showCustomer: boolean; showMaster: boolean }) =>
    api.put(`/estimates/${estimateId}/sections/${sectionId}`, data),
  
  // Items
  addItem: (estimateId: string, data: { sectionId: string; name: string; unit: string; quantity: number; customerPrice: number; masterPrice: number }) =>
    api.post<EstimateItem>(`/estimates/${estimateId}/items`, data),
  updateItem: (estimateId: string, itemId: string, data: Partial<EstimateItem>) =>
    api.put(`/estimates/${estimateId}/items/${itemId}`, data),
  deleteItem: (estimateId: string, itemId: string) =>
    api.delete(`/estimates/${estimateId}/items/${itemId}`),
  
  // Public views
  getCustomerView: (token: string) => 
    api.get<EstimateData>(`/estimates/customer/${token}`),
  getMasterView: (token: string) => 
    api.get<EstimateData>(`/estimates/master/${token}`),
  verifyMasterPassword: (token: string, password: string) =>
    api.post<EstimateData>(`/estimates/master/${token}/verify`, { password }),
  
  // Master password
  setMasterPassword: (estimateId: string, password: string) =>
    api.put<{ success: boolean; masterPassword: string }>(`/estimates/${estimateId}/master-password`, { password }),
  
  // Versions
  getVersions: (estimateId: string) =>
    api.get<EstimateVersion[]>(`/estimates/${estimateId}/versions`),
  createVersion: (estimateId: string, name?: string) =>
    api.post<EstimateVersion>(`/estimates/${estimateId}/versions`, { name }),
  getVersion: (estimateId: string, versionId: string) =>
    api.get<EstimateVersionWithSections>(`/estimates/${estimateId}/versions/${versionId}`),
  restoreVersion: (estimateId: string, versionId: string) =>
    api.post<{ message: string; restoredFrom: { versionNumber: number; name: string | null } }>(
      `/estimates/${estimateId}/versions/${versionId}/restore`
    ),

  // Act images
  getActImages: (estimateId: string) =>
    api.get<Record<string, string>>(`/estimates/${estimateId}/act-images`),
  uploadActImage: (estimateId: string, imageType: 'logo' | 'stamp' | 'signature', data: string) =>
    api.post<{ success: boolean; imageType: string }>(`/estimates/${estimateId}/act-images`, { imageType, data }),
  deleteActImage: (estimateId: string, imageType: 'logo' | 'stamp' | 'signature') =>
    api.delete(`/estimates/${estimateId}/act-images/${imageType}`),

  // AI Generation from PDF
  generateFromPdf: (formData: FormData) =>
    api.post<Estimate>('/estimates/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 360000, // 6 minutes for large PDF AI generation
    }),
}
