// ========== Estimate Views ==========

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

// ========== Estimate Items & Sections ==========

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

// ========== Projects ==========

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

// ========== Versions ==========

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

// ========== Public View ==========

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

// ========== Saved Acts ==========

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

// ========== Materials ==========

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

