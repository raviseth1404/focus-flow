import apiClient from './client'
import type { Profile, UserPreferences } from '@/types'

export const profileApi = {
  get: () => apiClient.get<Profile>('/me').then(r => r.data),
  update: (data: Partial<Profile>) => apiClient.put<Profile>('/me', data).then(r => r.data),
  getPreferences: () => apiClient.get<UserPreferences>('/me/preferences').then(r => r.data),
  updatePreferences: (data: Partial<UserPreferences>) =>
    apiClient.put<UserPreferences>('/me/preferences', data).then(r => r.data),
}
