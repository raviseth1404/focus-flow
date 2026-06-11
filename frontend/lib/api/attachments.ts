import apiClient from './client'
import type { Attachment } from '@/types'

export const attachmentsApi = {
  presign: (data: {
    entry_id: string
    section: 'activities' | 'notes'
    file_name: string
    mime_type: string
  }) =>
    apiClient
      .post<{ upload_url: string; storage_path: string; attachment_id: string }>('/attachments/presign', data)
      .then(r => r.data),

  confirm: (attachmentId: string) =>
    apiClient.post<Attachment>('/attachments/confirm', { attachment_id: attachmentId }).then(r => r.data),

  list: (entryId: string) =>
    apiClient.get<Attachment[]>(`/attachments/${entryId}`).then(r => r.data),

  delete: (id: string) => apiClient.delete(`/attachments/${id}`),
}
