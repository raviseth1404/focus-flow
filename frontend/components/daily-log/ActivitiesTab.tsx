'use client'

import { useCallback, useRef, useState } from 'react'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { AttachmentPanel } from './AttachmentPanel'
import { entriesApi } from '@/lib/api/entries'
import toast from 'react-hot-toast'
import type { FocusArea, DailyEntry } from '@/types'
import { Save, Check } from 'lucide-react'
import { ShareButton } from '@/components/ui/ShareButton'

interface ActivitiesTabProps {
  focusArea: FocusArea
  entry: DailyEntry | null
  selectedDate: string
  onEntryUpdate: (entry: DailyEntry) => void
}

export function ActivitiesTab({ focusArea, entry, selectedDate, onEntryUpdate }: ActivitiesTabProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingJsonRef = useRef<Record<string, unknown> | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const doSave = useCallback(async (json: Record<string, unknown>) => {
    setSaveState('saving')
    try {
      const updated = await entriesApi.upsert({
        focus_area_id: focusArea.id,
        entry_date: selectedDate,
        activities: json,
      })
      onEntryUpdate(updated)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      toast.error('Failed to save activities')
      setSaveState('idle')
    }
  }, [focusArea.id, selectedDate, onEntryUpdate])

  const handleChange = useCallback(
    (json: Record<string, unknown>) => {
      pendingJsonRef.current = json
      setSaveState('idle')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingJsonRef.current) doSave(pendingJsonRef.current)
      }, 800)
    },
    [doSave]
  )

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    // Use pending changes if available, otherwise fall back to the current entry content
    const json = pendingJsonRef.current ?? (entry?.activities as Record<string, unknown> ?? null)
    if (json) doSave(json)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{focusArea.icon}</span>
        <h3 className="font-heading font-semibold text-[var(--color-text-primary)]">
          {focusArea.name} — Activities
        </h3>
        {/* Save status / button */}
        <div className="ml-auto flex items-center gap-2">
          <ShareButton
            title={`${focusArea.name} — Activities (${selectedDate})`}
            text={entry?.activities_plain_text || ''}
            size="xs"
          />
          {saveState === 'saved' ? (
            <span className="flex items-center gap-1 text-xs text-[var(--color-accent)]">
              <Check size={12} /> Saved
            </span>
          ) : saveState === 'saving' ? (
            <span className="text-xs text-[var(--color-text-disabled)]">Saving…</span>
          ) : (
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors"
            >
              <Save size={11} /> Save
            </button>
          )}
        </div>
      </div>
      <RichTextEditor
        content={entry?.activities ?? null}
        placeholder={`What did you do for ${focusArea.name} today?`}
        onChange={handleChange}
      />
      <AttachmentPanel
        entryId={entry?.id ?? null}
        section="activities"
        focusAreaId={focusArea.id}
        selectedDate={selectedDate}
        onEntryCreated={async () => {
          const created = await entriesApi.upsert({ focus_area_id: focusArea.id, entry_date: selectedDate })
          onEntryUpdate(created)
          return created.id
        }}
      />
    </div>
  )
}
