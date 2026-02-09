/**
 * Materials API methods
 */

import { api } from './base'
import type { Material, MaterialRefreshResult, ProjectId, MaterialId } from '../../types'

/**
 * Materials API client
 * 
 * Provides methods for all material-related API operations including:
 * - Loading materials for a project
 * - Parsing materials from URLs (with extended timeout)
 * - Updating material properties
 * - Deleting materials
 * - Refreshing material prices (single or all, with extended timeouts)
 * 
 * All methods require projectId and return axios promises with typed responses.
 */
export const materialsApi = {
  getAll: (projectId: ProjectId) =>
    api.get<Material[]>(`/projects/${projectId}/materials`),

  parse: (projectId: ProjectId, urls: string[]) =>
    api.post<Material[]>(`/projects/${projectId}/materials/parse`, { urls }, {
      timeout: 300000,
    }),

  update: (projectId: ProjectId, materialId: MaterialId, data: Partial<Material>) =>
    api.put<Material>(`/projects/${projectId}/materials/${materialId}`, data),

  delete: (projectId: ProjectId, materialId: MaterialId) =>
    api.delete(`/projects/${projectId}/materials/${materialId}`),

  refreshAll: (projectId: ProjectId) =>
    api.post<MaterialRefreshResult>(`/projects/${projectId}/materials/refresh`, {}, {
      timeout: 300000,
    }),

  refreshOne: (projectId: ProjectId, materialId: MaterialId) =>
    api.post<Material>(`/projects/${projectId}/materials/refresh/${materialId}`, {}, {
      timeout: 60000,
    }),
}

