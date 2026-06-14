'use client'

import { useEffect, useCallback } from 'react'
import { useCalendarStore } from '@/store/useCalendarStore'
import { CalendarCell } from './CalendarCell'
import { CalendarNav } from './CalendarNav'
import { SkeletonCalendarCell } from '@/components/ui/SkeletonLoader'
import { entriesApi } from '@/lib/api/entries'
import { getDaysInMonth } from '@/lib/utils/dates'
import { DailyLogDrawer } from '@/components/daily-log/DailyLogDrawer'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarGrid() {
  const { currentYear, currentMonth, heatmapData, setHeatmapData, openDrawer } = useCalendarStore()
  const [isLoading, setIsLoading] = useState(true)

  const loadHeatmap = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await entriesApi.calendarHeatmap(currentYear, currentMonth + 1)
      setHeatmapData(data)
    } catch {}
    setIsLoading(false)
  }, [currentYear, currentMonth, setHeatmapData])

  useEffect(() => {
    loadHeatmap()
  }, [loadHeatmap])

  // Build grid with Mon-start
  const days = getDaysInMonth(currentYear, currentMonth)
  const firstDay = days[0]
  // 0=Sun, shift to Mon-first: Mon=0,...,Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7
  const paddingBefore = Array.from({ length: startOffset }, (_, i) => {
    const d = new Date(firstDay)
    d.setDate(d.getDate() - startOffset + i)
    return d
  })
  const lastDay = days[days.length - 1]
  const endOffset = (6 - ((lastDay.getDay() + 6) % 7))
  const paddingAfter = Array.from({ length: endOffset }, (_, i) => {
    const d = new Date(lastDay)
    d.setDate(d.getDate() + i + 1)
    return d
  })
  const allCells = [...paddingBefore, ...days, ...paddingAfter]

  return (
    <div>
      <CalendarNav />

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="flex items-center justify-center py-2 text-xs font-medium text-[var(--color-text-disabled)] uppercase tracking-wide"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {isLoading
          ? Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <SkeletonCalendarCell />
              </div>
            ))
          : allCells.map((date, i) => {
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              const isCurrentMonth = date.getMonth() === currentMonth
              return (
                <div key={i} className="flex items-center justify-center">
                  <CalendarCell
                    date={date}
                    heatmapData={heatmapData[dateStr]}
                    isCurrentMonth={isCurrentMonth}
                    onClick={() => openDrawer(dateStr)}
                  />
                </div>
              )
            })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-disabled)]">Completion:</span>
        {[
          { color: '#0FADA0', label: '< 40%' },
          { color: '#F4A636', label: '40–80%' },
          { color: '#FFFFFF', label: '100%' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-[var(--color-text-disabled)]">{label}</span>
          </div>
        ))}
      </div>

      <DailyLogDrawer onEntryUpdated={loadHeatmap} />
    </div>
  )
}
