'use client'

import { cn } from '@/lib/utils/cn'
import { CompletionArc } from './CompletionArc'
import { isToday, parseISO } from '@/lib/utils/dates'
import type { CalendarHeatmapItem } from '@/types'

const MOOD_COLORS: Record<string, string> = {
  great: '#22C55E',
  good: '#0FADA0',
  okay: '#F4A636',
  low: '#F59E0B',
  rough: '#EF4444',
}

const CELL_SIZE = 48

interface CalendarCellProps {
  date: Date
  heatmapData?: CalendarHeatmapItem
  isCurrentMonth: boolean
  onClick: () => void
}

export function CalendarCell({ date, heatmapData, isCurrentMonth, onClick }: CalendarCellProps) {
  const dateStr = date.toISOString().split('T')[0]
  const isTodayDate = isToday(date)
  const completionPct = heatmapData?.completion_pct ?? 0
  const mood = heatmapData?.mood
  const hasEntries = (heatmapData?.entry_count ?? 0) > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-lg transition-all duration-150',
        'hover:bg-[var(--color-bg-subtle)] focus:outline-none',
        !isCurrentMonth && 'opacity-30',
        isTodayDate && 'animate-[pulse-ring_2s_ease_infinite]'
      )}
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        boxShadow: isTodayDate ? '0 0 0 2px rgba(244,166,54,0.6)' : undefined,
      }}
      title={dateStr}
    >
      {/* Completion arc */}
      <CompletionArc percentage={completionPct} size={CELL_SIZE} />

      {/* Date number */}
      <span
        className={cn(
          'relative z-10 text-sm font-medium',
          isTodayDate
            ? 'text-[var(--color-accent)]'
            : hasEntries
            ? 'text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-disabled)]'
        )}
      >
        {date.getDate()}
      </span>

      {/* Mood dot */}
      {mood && (
        <div
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: MOOD_COLORS[mood] }}
        />
      )}
    </button>
  )
}
