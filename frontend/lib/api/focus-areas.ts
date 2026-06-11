import apiClient from './client'
import type { FocusArea, FocusAreaWithStats } from '@/types'

export const focusAreasApi = {
  list: () => apiClient.get<FocusArea[]>('/focus-areas').then(r => r.data),

  create: (data: Partial<FocusArea>) =>
    apiClient.post<FocusArea>('/focus-areas', data).then(r => r.data),

  get: (id: string) =>
    apiClient.get<FocusAreaWithStats>(`/focus-areas/${id}`).then(r => r.data),

  update: (id: string, data: Partial<FocusArea>) =>
    apiClient.put<FocusArea>(`/focus-areas/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/focus-areas/${id}`),

  reorder: (ids: string[]) =>
    apiClient.put<FocusArea[]>('/focus-areas/reorder', { ids }).then(r => r.data),
}
