import apiClient from './client'
import type { Profile, UserPreferences } from '@/types'

export interface StreakData {
  current_streak: number
  longest_streak: number
  total_days: number
  last_logged_date: string | null
}

export const profileApi = {
  get: () => apiClient.get<Profile>('/me').then(r => r.data),
  update: (data: Partial<Profile>) => apiClient.put<Profile>('/me', data).then(r => r.data),
  getPreferences: () => apiClient.get<UserPreferences>('/me/preferences').then(r => r.data),
  updatePreferences: (data: Partial<UserPreferences>) =>
    apiClient.put<UserPreferences>('/me/preferences', data).then(r => r.data),
  getStreak: () => apiClient.get<StreakData>('/me/streak').then(r => r.data),
  completeOnboarding: () => apiClient.patch<Profile>('/me/onboarding').then(r => r.data),
}
