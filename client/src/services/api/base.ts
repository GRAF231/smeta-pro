/**
 * Base API configuration and axios instance
 */

import axios from 'axios'
import { API_BASE_URL, HTTP_STATUS } from '../../constants/api'
import { ROUTES } from '../../constants/routes'
import { STORAGE_KEYS } from '../../constants/storage'
import { errorHandler } from '../errors'

/**
 * Base axios instance with default configuration
 * 
 * Configured with:
 * - Base URL from API_BASE_URL constant
 * - JSON content type header
 * - Response interceptor for handling errors using centralized error handler
 * 
 * The interceptor automatically:
 * - Processes errors through centralized error handler
 * - Removes auth token from localStorage on 401
 * - Clears Authorization header
 * - Redirects to login page if not already there
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Response interceptor for error handling
 * 
 * Uses centralized error handler to process all API errors.
 * Handles 401 Unauthorized errors by clearing authentication state
 * and redirecting to login page.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors with special logic
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      delete api.defaults.headers.common['Authorization']
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.href = ROUTES.LOGIN
      }
    }

    // Process error through centralized error handler
    // This ensures consistent error handling and logging across the app
    errorHandler.handle(error, 'Ошибка при выполнении запроса', {
      url: error.config?.url,
      method: error.config?.method,
    })

    return Promise.reject(error)
  }
)

