'use client'

import { useCalendarStore } from '@/store/useCalendarStore'
import { parseISO, format } from 'date-fns'
import { FileText } from 'lucide-react'
import type { SearchResult } from '@/types'

interface SearchResultItemProps {
  result: SearchResult
  query: string
  onSelect: () => void
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--color-accent-muted)] text-[var(--color-accent)] rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function SearchResultItem({ result, query, onSelect }: SearchResultItemProps) {
  const { openDrawer } = useCalendarStore()

  const preview = result.activities_plain_text || result.notes_plain_text || ''
  const truncated = preview.length > 120 ? preview.slice(0, 120) + '…' : preview

  const handleClick = () => {
    openDrawer(result.entry_date)
    onSelect()
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-4 py-3 hover:bg-[var(--color-bg-subtle)] transition-colors border-b border-[var(--color-border)] last:border-0"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-lg flex-shrink-0">
          {result.focus_area?.icon ?? <FileText size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-[var(--color-accent)]">
              {result.focus_area?.name ?? 'Entry'}
            </span>
            <span className="text-xs text-[var(--color-text-disabled)]">
              {format(parseISO(result.entry_date), 'MMM d, yyyy')}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {highlight(truncated, query)}
          </p>
        </div>
      </div>
    </button>
  )
}
