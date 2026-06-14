'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ActivitiesTab } from './ActivitiesTab'
import { NotesTab } from './NotesTab'
import { TodoChecklist } from './TodoChecklist'
import type { FocusArea, DailyEntry } from '@/types'

type TabId = 'activities' | 'notes'

interface FocusAreaTabsProps {
  focusAreas: FocusArea[]
  entries: DailyEntry[]
  activeFocusAreaId: string | null
  onTabChange: (id: string) => void
  selectedDate: string
  activeEntry: DailyEntry | null
  onEntryUpdate: (entry: DailyEntry) => void
}

export function FocusAreaTabs({
  focusAreas,
  entries,
  activeFocusAreaId,
  onTabChange,
  selectedDate,
  activeEntry,
  onEntryUpdate,
}: FocusAreaTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('activities')

  const activeFocusArea = focusAreas.find((fa) => fa.id === activeFocusAreaId)
  const entryForArea = (faId: string) => entries.find((e) => e.focus_area_id === faId)

  return (
    <div className="flex flex-col">
      {/* Focus Area selector */}
      <div className="px-6 pt-4 pb-2 border-b border-[var(--color-border)]">
        <div className="flex gap-2 flex-wrap">
          {focusAreas.map((fa) => {
            const hasEntry = !!entryForArea(fa.id)
            return (
              <button
                key={fa.id}
                onClick={() => onTabChange(fa.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                  activeFocusAreaId === fa.id
                    ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-accent-muted)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
                )}
              >
                <span>{fa.icon}</span>
                <span>{fa.name}</span>
                {hasEntry && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {activeFocusArea && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 px-6 pt-3 pb-0">
            {(['activities', 'notes'] as TabId[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2',
                  activeTab === tab
                    ? 'text-[var(--color-accent)] border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                    : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
                )}
              >
                {tab === 'activities' ? 'Activities' : 'Notes'}
              </button>
            ))}
          </div>

          {/* Tab content — no fixed height, let the Drawer's outer scroll handle overflow */}
          <div className="p-6">
            {activeTab === 'activities' && (
              <>
                <TodoChecklist
                  entry={activeEntry}
                  focusArea={activeFocusArea}
                  entryDate={selectedDate}
                  focusAreaId={activeFocusArea.id}
                  onEntryUpdate={onEntryUpdate}
                />
                <ActivitiesTab
                  focusArea={activeFocusArea}
                  entry={activeEntry}
                  selectedDate={selectedDate}
                  onEntryUpdate={onEntryUpdate}
                />
              </>
            )}
            {activeTab === 'notes' && (
              <NotesTab
                focusArea={activeFocusArea}
                entry={activeEntry}
                selectedDate={selectedDate}
                onEntryUpdate={onEntryUpdate}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
