'use client'

import { useEffect, useRef, useState } from 'react'
import { attachmentsApi } from '@/lib/api/attachments'
import toast from 'react-hot-toast'
import { Paperclip, Trash2, FileText, Image, Download, Upload } from 'lucide-react'
import type { Attachment } from '@/types'

interface AttachmentPanelProps {
  entryId: string | null
  section: 'activities' | 'notes'
  focusAreaId: string
  selectedDate: string
  onEntryCreated?: () => Promise<string | null>  // returns newly created entry id
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith('image/')) return <Image size={14} className="flex-shrink-0 text-blue-400" />
  return <FileText size={14} className="flex-shrink-0 text-[var(--color-text-disabled)]" />
}

export function AttachmentPanel({ entryId, section, focusAreaId, selectedDate, onEntryCreated }: AttachmentPanelProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (entryId && isExpanded) {
      setIsLoading(true)
      attachmentsApi.list(entryId)
        .then(setAttachments)
        .catch(() => {})
        .finally(() => setIsLoading(false))
    } else if (!entryId) {
      setAttachments([])
    }
  }, [entryId, isExpanded])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    try {
      // If no entry exists yet, create one first via the parent callback
      let eid = entryId
      if (!eid && onEntryCreated) {
        eid = await onEntryCreated()
      }
      if (!eid) {
        toast.error('Please save an entry first before attaching files')
        setUploading(false)
        return
      }

      // Client-side size check
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File exceeds the 10 MB size limit')
        setUploading(false)
        return
      }

      // 1. Presign
      const { upload_url, attachment_id } = await attachmentsApi.presign({
        entry_id: eid,
        section,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size,
      })

      // 2. Upload directly to storage
      const uploadResp = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!uploadResp.ok) throw new Error('Upload failed')

      // 3. Confirm
      const confirmed = await attachmentsApi.confirm(attachment_id)
      setAttachments(prev => [...prev, confirmed])
      toast.success('File attached')
    } catch {
      toast.error('Failed to attach file')
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this attachment?')) return
    try {
      await attachmentsApi.delete(id)
      setAttachments(prev => prev.filter(a => a.id !== id))
      toast.success('Attachment removed')
    } catch {
      toast.error('Failed to remove attachment')
    }
  }

  const count = attachments.length

  return (
    <div className="mt-3 border-t border-[var(--color-border)]">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="flex items-center gap-2 pt-2 pb-1 text-xs text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] transition-colors w-full"
      >
        <Paperclip size={12} />
        <span>{count > 0 ? `${count} attachment${count !== 1 ? 's' : ''}` : 'Attachments'}</span>
        <span className="ml-auto text-[10px]">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="pb-3">
          {isLoading ? (
            <p className="text-xs text-[var(--color-text-disabled)] py-2">Loading…</p>
          ) : attachments.length === 0 ? (
            <p className="text-xs text-[var(--color-text-disabled)] py-1">No attachments yet.</p>
          ) : (
            <ul className="space-y-1 mb-2">
              {attachments.map(a => (
                <li key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] text-xs group">
                  <FileIcon mimeType={a.mime_type} />
                  <span className="flex-1 truncate text-[var(--color-text-primary)]">{a.file_name}</span>
                  {a.file_size_bytes && (
                    <span className="text-[var(--color-text-disabled)] flex-shrink-0">{formatBytes(a.file_size_bytes)}</span>
                  )}
                  {a.signed_url && (
                    <a
                      href={a.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-disabled)] hover:text-[var(--color-accent)] transition-colors flex-shrink-0"
                      title="Download"
                    >
                      <Download size={12} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="text-[var(--color-text-disabled)] hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-elevated)] border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={11} />
            {uploading ? 'Uploading…' : 'Attach file (max 10 MB)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
          />
        </div>
      )}
    </div>
  )
}
