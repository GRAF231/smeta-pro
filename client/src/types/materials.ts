/**
 * Material-related types
 */

/**
 * Material entity
 * 
 * Represents a material/product parsed from a URL (typically from online stores).
 * Contains pricing, quantity, and metadata information.
 */
export interface Material {
  /** Unique material identifier */
  id: string
  /** Associated estimate/project ID */
  estimateId: string
  /** Material name */
  name: string
  /** Article/SKU number */
  article: string
  /** Brand/manufacturer name */
  brand: string
  /** Unit of measurement */
  unit: string
  /** Price per unit */
  price: number
  /** Quantity */
  quantity: number
  /** Total cost (price * quantity) */
  total: number
  /** Source URL where material was parsed from */
  url: string
  /** Material description */
  description: string
  /** Sort order for display */
  sortOrder: number
  /** Creation timestamp (ISO string) */
  createdAt: string
  /** Last update timestamp (ISO string) */
  updatedAt: string
}

/**
 * Result of material refresh operation
 * 
 * Returned when refreshing material prices (either single or all materials).
 */
export interface MaterialRefreshResult {
  /** Success message */
  message: string
  /** Number of materials updated */
  updated: number
  /** Updated materials array */
  materials: Material[]
}

