import apiClient from './client'
import type { DailyEntry, WeeklyDigest } from '@/types'

export const aiApi = {
  summarize: (entryId: string) =>
    apiClient.post<DailyEntry>('/ai/summarize', { entry_id: entryId }).then(r => r.data),

  weeklyDigest: (weekStart: string) =>
    apiClient.post<WeeklyDigest>('/ai/weekly-digest', { week_start: weekStart }).then(r => r.data),
}
