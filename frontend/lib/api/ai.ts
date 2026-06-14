import apiClient from './client'
import type { DailyEntry, WeeklyDigest } from '@/types'

export interface FocusAreaSummaryResponse {
  summary: string
  total_notes: number
  date_range: string
}

export const aiApi = {
  summarize: (entryId: string) =>
    apiClient.post<DailyEntry>('/ai/summarize', { entry_id: entryId }).then(r => r.data),

  weeklyDigest: (weekStart: string) =>
    apiClient.post<WeeklyDigest>('/ai/weekly-digest', { week_start: weekStart }).then(r => r.data),

  summarizeFocusArea: (focusAreaId: string) =>
    apiClient
      .post<FocusAreaSummaryResponse>('/ai/summarize-focus-area', { focus_area_id: focusAreaId })
      .then(r => r.data),
}
