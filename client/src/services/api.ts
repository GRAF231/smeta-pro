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
  createdAt: string
}

export interface EstimateData {
  title: string
  sections: Section[]
  total: number
}

export interface Section {
  name: string
  items: EstimateItem[]
  subtotal: number
}

export interface EstimateItem {
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
  getOne: (id: string) => api.get<Estimate>(`/estimates/${id}`),
  create: (data: { title: string; googleSheetUrl: string }) => 
    api.post<Estimate>('/estimates', data),
  update: (id: string, data: { title: string; googleSheetUrl: string }) => 
    api.put<Estimate>(`/estimates/${id}`, data),
  delete: (id: string) => api.delete(`/estimates/${id}`),
  
  // Public views
  getCustomerView: (token: string) => 
    api.get<EstimateData>(`/estimates/customer/${token}`),
  getMasterView: (token: string) => 
    api.get<EstimateData>(`/estimates/master/${token}`),
}

