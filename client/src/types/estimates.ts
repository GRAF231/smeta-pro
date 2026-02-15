/**
 * Estimate-related types (views, sections, items, versions)
 */

/**
 * Estimate view configuration
 * 
 * Represents a customizable view of an estimate with its own settings
 * for item prices and visibility. Each view has a unique link token
 * for public access.
 */
export interface EstimateView {
  /** Unique view identifier */
  id: string
  /** View name */
  name: string
  /** Unique token for public access link */
  linkToken: string
  /** Optional password for protected views */
  password: string
  /** Sort order for display */
  sortOrder: number
  /** Whether this is the customer view (смета для заказчика) */
  isCustomerView: boolean
}

/**
 * View-specific settings for an item
 * 
 * Each item can have different price and visibility per view.
 */
export interface ViewItemSettings {
  /** Custom price for this item in this view */
  price: number
  /** Calculated total (price * quantity) */
  total: number
  /** Whether item is visible in this view */
  visible: boolean
}

/**
 * View-specific settings for a section
 * 
 * Sections can be hidden per view.
 */
export interface ViewSectionSettings {
  /** Whether section is visible in this view */
  visible: boolean
}

/**
 * Estimate item (position in estimate)
 * 
 * Represents a single line item in an estimate with quantity, unit, etc.
 * Contains view-specific settings for customization per view.
 */
export interface EstimateItem {
  /** Unique item identifier */
  id: string
  /** Item number (e.g., "1.1", "2.3") */
  number: string
  /** Item name/description */
  name: string
  /** Unit of measurement (e.g., "шт", "м²", "м") */
  unit: string
  /** Quantity */
  quantity: number
  /** Sort order for display */
  sortOrder: number
  /** View-specific settings mapped by viewId */
  viewSettings: Record<string, ViewItemSettings>  // viewId -> settings
}

/**
 * Estimate section (group of items)
 * 
 * Represents a logical grouping of items (e.g., "Подготовительные работы").
 * Contains view-specific visibility settings.
 */
export interface EstimateSection {
  /** Unique section identifier */
  id: string
  /** Section name */
  name: string
  /** Sort order for display */
  sortOrder: number
  /** View-specific settings mapped by viewId */
  viewSettings: Record<string, ViewSectionSettings>  // viewId -> settings
  /** Items belonging to this section */
  items: EstimateItem[]
}

/**
 * Estimate version (snapshot of estimate at a point in time)
 * 
 * Represents a saved snapshot of the estimate state, allowing
 * restoration to previous versions.
 */
export interface EstimateVersion {
  /** Unique version identifier */
  id: string
  /** Version number (sequential) */
  versionNumber: number
  /** Optional version name/description */
  name: string | null
  /** Version creation timestamp (ISO string) */
  createdAt: string
}

/**
 * View in an estimate version
 * 
 * Simplified view information stored in a version snapshot.
 */
export interface EstimateVersionView {
  /** View identifier */
  id: string
  /** View name */
  name: string
  /** Sort order */
  sortOrder: number
}

/**
 * Estimate version with full data
 * 
 * Complete version data including all sections and items as they were
 * at the time of version creation.
 */
export interface EstimateVersionWithSections extends EstimateVersion {
  /** Views that existed at version creation */
  views: EstimateVersionView[]
  /** Sections with items as they were at version creation */
  sections: EstimateSection[]
}

/**
 * Public estimate data (for customer/master views)
 * 
 * Simplified estimate structure for public viewing, containing only
 * visible sections and items with calculated totals.
 */
export interface EstimateData {
  /** Project title */
  title: string
  /** View name (if applicable) */
  viewName?: string
  /** Public sections (only visible ones) */
  sections: PublicSection[]
  /** Grand total */
  total: number
  /** Balance (paid - completed) calculated using prices from current view */
  balance: number
  /** Whether password is required to view */
  requiresPassword?: boolean
}

/**
 * Section in public view
 * 
 * Simplified section structure for public display.
 */
export interface PublicSection {
  /** Section name */
  name: string
  /** Items in this section */
  items: PublicViewItem[]
  /** Section subtotal */
  subtotal: number
}

/**
 * Item in public view
 * 
 * Simplified item structure for public display with all calculations done.
 */
export interface PublicViewItem {
  /** Item number */
  number: string
  /** Item name */
  name: string
  /** Unit of measurement */
  unit: string
  /** Quantity */
  quantity: number
  /** Price per unit */
  price: number
  /** Total (price * quantity) */
  total: number
  /** Paid amount for this item */
  paidAmount: number
  /** Completed amount for this item */
  completedAmount: number
}

// Legacy type aliases for backward compatibility
export type Section = PublicSection
export type ViewItem = PublicViewItem

// ========== PAYMENT TYPES ==========

/**
 * Payment information
 */
export interface Payment {
  /** Unique payment identifier */
  id: string
  /** Payment amount */
  amount: number
  /** Payment date (ISO string) */
  paymentDate: string
  /** Payment notes */
  notes: string
  /** Creation timestamp (ISO string) */
  createdAt: string
  /** Items included in this payment */
  items: PaymentItem[]
}

/**
 * Payment item (link between payment and estimate item)
 */
export interface PaymentItem {
  /** Unique payment item identifier */
  id: string
  /** Estimate item ID */
  itemId: string
  /** Amount paid for this item */
  amount: number
}

/**
 * Item status (paid/completed amounts)
 */
export interface ItemStatus {
  /** Estimate item ID */
  itemId: string
  /** Total paid amount for this item */
  paidAmount: number
  /** Total completed amount for this item */
  completedAmount: number
}

