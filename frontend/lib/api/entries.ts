import apiClient from './client'
import type { DailyEntry, CalendarHeatmapItem, PaginatedResponse } from '@/types'

export const entriesApi = {
  listByDate: (date: string) =>
    apiClient.get<DailyEntry[]>('/entries', { params: { date } }).then(r => r.data),

  listByFocusArea: (focusAreaId: string, limit = 20, offset = 0) =>
    apiClient
      .get<PaginatedResponse<DailyEntry>>('/entries', {
        params: { focus_area_id: focusAreaId, limit, offset },
      })
      .then(r => r.data),

  get: (id: string) =>
    apiClient.get<DailyEntry>(`/entries/${id}`).then(r => r.data),

  upsert: (data: {
    focus_area_id: string
    entry_date: string
    activities?: unknown
    notes?: unknown
    mood?: string
  }) => apiClient.post<DailyEntry>('/entries', data).then(r => r.data),

  update: (id: string, data: Partial<DailyEntry>) =>
    apiClient.put<DailyEntry>(`/entries/${id}`, data).then(r => r.data),

  updateTodos: (id: string, completions: Record<string, boolean>) =>
    apiClient.patch<DailyEntry>(`/entries/${id}/todos`, { todo_completions: completions }).then(r => r.data),

  togglePin: (id: string, is_pinned: boolean) =>
    apiClient.patch<DailyEntry>(`/entries/${id}/pin`, { is_pinned }).then(r => r.data),

  calendarHeatmap: (year: number, month: number) =>
    apiClient
      .get<CalendarHeatmapItem[]>('/entries/calendar-heatmap', { params: { year, month } })
      .then(r => r.data),

  deleteNotes: (id: string) =>
    apiClient.delete(`/entries/${id}/notes`),
}
