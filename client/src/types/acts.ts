/**
 * Act (Акт выполненных работ) related types
 * 
 * Types for managing acts of completed work (acts of acceptance).
 */

/**
 * Saved act summary
 * 
 * Basic information about a saved act, used in lists.
 */
export interface SavedAct {
  /** Unique act identifier */
  id: string
  /** Act number */
  actNumber: string
  /** Act date (ISO string) */
  actDate: string
  /** Executor/contractor name */
  executorName: string
  /** Customer/client name */
  customerName: string
  /** Selection mode used when creating act */
  selectionMode: string
  /** Grand total amount */
  grandTotal: number
  /** Creation timestamp (ISO string) */
  createdAt: string
}

/**
 * Saved act with full details
 * 
 * Complete act information including all items and additional details.
 */
export interface SavedActDetail extends SavedAct {
  /** Executor details (address, contacts, etc.) */
  executorDetails: string
  /** Director name for signature */
  directorName: string
  /** Service/work description */
  serviceName: string
  /** Items included in this act */
  items: SavedActItem[]
}

/**
 * Item in a saved act
 * 
 * Represents a single line item in an act. May reference an estimate item
 * (if itemId/sectionId are set) or be a standalone item.
 */
export interface SavedActItem {
  /** Unique item identifier */
  id: string
  /** Reference to estimate item ID (if applicable) */
  itemId: string | null
  /** Reference to estimate section ID (if applicable) */
  sectionId: string | null
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
}

/**
 * Information about where an item was used
 * 
 * Tracks which acts have used a particular estimate item.
 */
export interface UsedItemInfo {
  /** Act ID where item was used */
  actId: string
  /** Act number */
  actNumber: string
  /** Act date (ISO string) */
  actDate: string
}

/**
 * Map of item IDs to their usage information
 * 
 * Used to track which estimate items have been used in which acts.
 * Key is itemId, value is array of acts where item was used.
 */
export type UsedItemsMap = Record<string, UsedItemInfo[]>

