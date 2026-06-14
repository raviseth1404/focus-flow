import apiClient from './client'
import type { DailyMood, Mood } from '@/types'

export const moodsApi = {
  upsert: (entry_date: string, mood: Mood, note?: string) =>
    apiClient.post<DailyMood>('/moods', { entry_date, mood, note }).then(r => r.data),

  listByMonth: (month: string) =>
    apiClient.get<DailyMood[]>('/moods', { params: { month } }).then(r => r.data),
}
