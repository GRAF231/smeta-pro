/**
 * Authentication and user-related types
 */

/**
 * User role types
 * 
 * Defines available user roles in the system:
 * - 'brigadir' - Foreman/contractor role
 * - 'customer' - Customer/client role
 * - 'master' - Master craftsman role
 */
export type UserRole = 'brigadir' | 'customer' | 'master'

/**
 * User information
 * 
 * Represents an authenticated user in the system.
 */
export interface User {
  /** Unique user identifier */
  id: string
  /** User email address */
  email: string
  /** User display name */
  name: string
  /** User role */
  role: UserRole
}

