/**
 * YooKassa API methods
 */

import { api } from './base'

/**
 * YooKassa API client
 */
export const yookassaApi = {
  /**
   * Проверить, настроены ли учетные данные ЮKassa
   */
  checkConfiguration: () => api.get<{ configured: boolean }>('/yookassa/config'),
}

