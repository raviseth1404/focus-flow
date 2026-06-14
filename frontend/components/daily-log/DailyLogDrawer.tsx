'use client'

import { useEffect, useState, useCallback } from 'react'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useFocusAreaStore } from '@/store/useFocusAreaStore'
import { Drawer } from '@/components/ui/Drawer'
import { FocusAreaTabs } from './FocusAreaTabs'
import { MoodPicker } from './MoodPicker'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import { EmptyState, NoEntriesIllustration } from '@/components/ui/EmptyState'
import { focusAreasApi } from '@/lib/api/focus-areas'
import { entriesApi } from '@/lib/api/entries'
import { moodsApi } from '@/lib/api/moods'
import { format, parseISO } from 'date-fns'
import type { DailyEntry, Mood } from '@/types'

interface DailyLogDrawerProps {
  onEntryUpdated?: () => void
}

export function DailyLogDrawer({ onEntryUpdated }: DailyLogDrawerProps) {
  const { isDrawerOpen, closeDrawer, selectedDate } = useCalendarStore()
  const { focusAreas, setFocusAreas } = useFocusAreaStore()
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeFocusAreaId, setActiveFocusAreaId] = useState<string | null>(null)
  const [currentMood, setCurrentMood] = useState<Mood | null>(null)

  const loadData = useCallback(async () => {
    if (!selectedDate) return
    setIsLoading(true)
    try {
      const month = selectedDate.slice(0, 7)
      const [areas, dayEntries, monthMoods] = await Promise.all([
        focusAreasApi.list(),
        entriesApi.listByDate(selectedDate),
        moodsApi.listByMonth(month),
      ])
      setFocusAreas(areas)
      setEntries(dayEntries)
      const todayMood = monthMoods.find(m => m.entry_date === selectedDate)
      setCurrentMood(todayMood?.mood ?? null)
      // Always reset to first area on open — ensures deleted/reordered areas don't leave a blank tab
      if (areas.length > 0) {
        setActiveFocusAreaId(prev => {
          // Keep existing selection only if it still exists in the new list
          const stillExists = areas.some(a => a.id === prev)
          return stillExists ? prev : areas[0].id
        })
      }
    } catch {}
    setIsLoading(false)
  }, [selectedDate, activeFocusAreaId, setFocusAreas])

  useEffect(() => {
    if (isDrawerOpen && selectedDate) {
      loadData()
    }
  }, [isDrawerOpen, selectedDate, loadData])

  const handleEntryUpdate = (updated: DailyEntry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.focus_area_id === updated.focus_area_id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updated
        return next
      }
      return [...prev, updated]
    })
    onEntryUpdated?.()
  }

  const formattedDate = selectedDate
    ? format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')
    : ''

  const activeEntry = entries.find((e) => e.focus_area_id === activeFocusAreaId) ?? null

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      title={formattedDate}
      width="max-w-2xl"
    >
      {isLoading ? (
        <div className="p-6">
          <SkeletonList count={2} />
        </div>
      ) : focusAreas.length === 0 ? (
        <EmptyState
          icon={<NoEntriesIllustration />}
          title="No focus areas yet"
          description="Create focus areas to start logging your day."
        />
      ) : (
        <div className="flex flex-col h-full">
          <MoodPicker
            selectedDate={selectedDate!}
            currentMood={currentMood}
            onMoodSaved={(mood) => { setCurrentMood(mood); onEntryUpdated?.() }}
          />
          <FocusAreaTabs
            focusAreas={focusAreas}
            entries={entries}
            activeFocusAreaId={activeFocusAreaId}
            onTabChange={setActiveFocusAreaId}
            selectedDate={selectedDate!}
            activeEntry={activeEntry}
            onEntryUpdate={handleEntryUpdate}
          />
        </div>
      )}
    </Drawer>
  )
}
