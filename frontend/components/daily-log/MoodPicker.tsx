'use client'

import { useState } from 'react'
import { moodsApi } from '@/lib/api/moods'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'
import type { Mood } from '@/types'

const MOODS: { value: Mood; emoji: string; label: string; color: string }[] = [
  { value: 'great',  emoji: '😄', label: 'Great',  color: '#22c55e' },
  { value: 'good',   emoji: '🙂', label: 'Good',   color: '#0FADA0' },
  { value: 'okay',   emoji: '😐', label: 'Okay',   color: '#F4A636' },
  { value: 'low',    emoji: '😔', label: 'Low',    color: '#f97316' },
  { value: 'rough',  emoji: '😞', label: 'Rough',  color: '#ef4444' },
]

interface MoodPickerProps {
  selectedDate: string
  currentMood: Mood | null
  onMoodSaved: (mood: Mood) => void
}

export function MoodPicker({ selectedDate, currentMood, onMoodSaved }: MoodPickerProps) {
  const [saving, setSaving] = useState<Mood | null>(null)
  const [selected, setSelected] = useState<Mood | null>(currentMood)

  const handleSelect = async (mood: Mood) => {
    if (saving) return
    setSaving(mood)
    try {
      await moodsApi.upsert(selectedDate, mood)
      setSelected(mood)
      onMoodSaved(mood)
      toast.success(`Mood saved: ${MOODS.find(m => m.value === mood)?.label}`)
    } catch {
      toast.error('Failed to save mood')
    }
    setSaving(null)
  }

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--color-border)]">
      <span className="text-xs font-medium text-[var(--color-text-disabled)] uppercase tracking-wide">
        Today's mood
      </span>
      <div className="flex items-center gap-1">
        {MOODS.map((m) => {
          const isSelected = selected === m.value
          const isSaving = saving === m.value
          return (
            <button
              key={m.value}
              onClick={() => handleSelect(m.value)}
              disabled={!!saving}
              title={m.label}
              className={cn(
                'w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all',
                'hover:scale-110 disabled:cursor-not-allowed',
                isSelected
                  ? 'scale-110 bg-[var(--color-bg-elevated)]'
                  : 'opacity-50 hover:opacity-100',
                isSaving && 'animate-pulse'
              )}
              style={isSelected ? { boxShadow: `0 0 0 2px ${m.color}` } : {}}
            >
              {m.emoji}
            </button>
          )
        })}
      </div>
      {selected && (
        <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
          {MOODS.find(m => m.value === selected)?.label}
        </span>
      )}
    </div>
  )
}
