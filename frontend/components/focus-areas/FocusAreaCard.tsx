'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { MoreHorizontal, Edit, Trash2, Archive } from 'lucide-react'
import { useState } from 'react'
import type { FocusAreaWithStats } from '@/types'

interface FocusAreaCardProps {
  focusArea: FocusAreaWithStats
  onEdit: (fa: FocusAreaWithStats) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}

export function FocusAreaCard({ focusArea, onEdit, onDelete, onArchive }: FocusAreaCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const completionRatio = focusArea.total_days / Math.max(1, focusArea.target_days_per_week * 52)
  const progressPct = Math.min(100, Math.round(completionRatio * 100 * 4))

  return (
    <div className="card p-6 relative group flex flex-col gap-4 hover:border-[rgba(255,255,255,0.12)] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Link href={`/focus-areas/${focusArea.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${focusArea.color}20` }}
          >
            {focusArea.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-[var(--color-text-primary)] truncate">
              {focusArea.name}
            </h3>
            {focusArea.description && (
              <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                {focusArea.description}
              </p>
            )}
          </div>
        </Link>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-all"
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 card py-1 shadow-modal">
                <button
                  onClick={() => { onEdit(focusArea); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                >
                  <Edit size={13} /> Edit
                </button>
                <button
                  onClick={() => { onArchive(focusArea.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                >
                  <Archive size={13} /> Archive
                </button>
                <button
                  onClick={() => { onDelete(focusArea.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-error)] hover:bg-[rgba(239,68,68,0.1)]"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="font-mono text-xl font-medium text-[var(--color-text-primary)]">
            {focusArea.total_days}
          </p>
          <p className="text-xs text-[var(--color-text-disabled)]">days logged</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-xl font-medium text-[var(--color-text-primary)]">
            {focusArea.target_days_per_week}
          </p>
          <p className="text-xs text-[var(--color-text-disabled)]">days/week</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-xl font-medium text-[var(--color-text-primary)]">
            {Math.round((focusArea.total_words || 0) / 1000 * 10) / 10}k
          </p>
          <p className="text-xs text-[var(--color-text-disabled)]">words</p>
        </div>
      </div>

      {/* Color bar */}
      <div className="h-1 rounded-full bg-[var(--color-bg-subtle)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            backgroundColor: focusArea.color,
          }}
        />
      </div>

      {focusArea.last_entry_date && (
        <p className="text-xs text-[var(--color-text-disabled)]">
          Last entry: {focusArea.last_entry_date}
        </p>
      )}
    </div>
  )
}
