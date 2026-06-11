'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { CALENDAR_START, CALENDAR_END } from '@/lib/utils/dates'
import { useCalendarStore } from '@/store/useCalendarStore'
import { cn } from '@/lib/utils/cn'

export function CalendarNav() {
  const { currentYear, currentMonth, setMonth } = useCalendarStore()
  const current = new Date(currentYear, currentMonth, 1)

  const canGoPrev =
    new Date(currentYear, currentMonth - 1, 1) >= CALENDAR_START
  const canGoNext =
    new Date(currentYear, currentMonth + 1, 1) <= CALENDAR_END

  const goToPrev = () => {
    if (!canGoPrev) return
    const d = new Date(currentYear, currentMonth - 1, 1)
    setMonth(d.getFullYear(), d.getMonth())
  }

  const goToNext = () => {
    if (!canGoNext) return
    const d = new Date(currentYear, currentMonth + 1, 1)
    setMonth(d.getFullYear(), d.getMonth())
  }

  const goToToday = () => {
    const now = new Date()
    setMonth(now.getFullYear(), now.getMonth())
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-2xl font-semibold text-[var(--color-text-primary)]">
          {format(current, 'MMMM yyyy')}
        </h2>
        <button
          onClick={goToToday}
          className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:bg-[rgba(244,166,54,0.22)] transition-colors"
        >
          Today
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={goToPrev}
          disabled={!canGoPrev}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canGoPrev
              ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]'
              : 'text-[var(--color-text-disabled)] cursor-not-allowed'
          )}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={goToNext}
          disabled={!canGoNext}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canGoNext
              ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]'
              : 'text-[var(--color-text-disabled)] cursor-not-allowed'
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
