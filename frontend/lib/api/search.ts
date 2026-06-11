import apiClient from './client'
import type { SearchResult } from '@/types'

export const searchApi = {
  search: (params: {
    q: string
    focus_area_id?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }) =>
    apiClient
      .get<{ results: SearchResult[]; total: number }>('/search', { params })
      .then(r => r.data),
}
