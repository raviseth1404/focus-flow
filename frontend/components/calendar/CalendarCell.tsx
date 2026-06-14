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

interface CalendarCellProps {
  date: Date
  heatmapData?: CalendarHeatmapItem
  isCurrentMonth: boolean
  onClick: () => void
}

export function CalendarCell({ date, heatmapData, isCurrentMonth, onClick }: CalendarCellProps) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const isTodayDate = isToday(date)
  const completionPct = heatmapData?.completion_pct ?? 0
  const mood = heatmapData?.mood
  const hasEntries = (heatmapData?.entry_count ?? 0) > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-lg transition-all duration-150 w-full aspect-square',
        'hover:bg-[var(--color-bg-subtle)] focus:outline-none',
        !isCurrentMonth && 'opacity-30',
        isTodayDate && 'animate-[pulse-ring_2s_ease_infinite]'
      )}
      style={{
        boxShadow: isTodayDate ? '0 0 0 2px rgba(244,166,54,0.6)' : undefined,
      }}
      title={dateStr}
    >
      {/* Completion arc — fills the cell */}
      <div className="absolute inset-0 flex items-center justify-center">
        <CompletionArcResponsive percentage={completionPct} />
      </div>

      {/* Date number */}
      <span
        className={cn(
          'relative z-10 text-xs sm:text-sm font-medium',
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
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: MOOD_COLORS[mood] }}
        />
      )}
    </button>
  )
}

// SVG arc that fills 100% of its container
function CompletionArcResponsive({ percentage }: { percentage: number }) {
  if (percentage <= 0) return null
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const strokeDash = (percentage / 100) * circumference
  const color = percentage >= 100 ? '#FFFFFF' : percentage >= 40 ? '#F4A636' : '#0FADA0'

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="50" cy="50" r={radius} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${strokeDash} ${circumference}`}
        strokeLinecap="round"
      />
    </svg>
  )
}
