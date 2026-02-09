/**
 * Authentication API methods
 */

import { api } from './base'
import type { User } from '../../types'

/**
 * Authentication API client
 * 
 * Provides methods for authentication operations:
 * - Getting current user information
 * - User login
 * - User registration
 * 
 * All methods return axios promises with typed responses.
 */
export const authApi = {
  /**
   * Get current authenticated user information
   * 
   * @returns Promise resolving to user data
   * @throws Error if user is not authenticated
   */
  getMe: () => api.get<{ user: User }>('/auth/me'),

  /**
   * Login with email and password
   * 
   * @param email - User email address
   * @param password - User password
   * @returns Promise resolving to token and user data
   * @throws Error if credentials are invalid
   */
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),

  /**
   * Register a new user account
   * 
   * @param email - User email address
   * @param password - User password
   * @param name - User display name
   * @returns Promise resolving to token and user data
   * @throws Error if registration fails (e.g., email already exists)
   */
  register: (email: string, password: string, name: string) =>
    api.post<{ token: string; user: User }>('/auth/register', { email, password, name }),
}

